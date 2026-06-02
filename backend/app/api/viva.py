from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, Header
from pydantic import BaseModel
import json
import random
import re
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId
from jose import jwt

from app.services.pdf_text_extractor import pdf_text_extractor
from app.services.chunking_service import chunk_markdown_text
from app.services.vector_db import create_vector_store
from app.services.ai_examiner import client, MODEL_NAME
from app.models.viva_learning import DoubtRequest, DoubtResponse, ExplainRequest, ExplainResponse
from app.services.viva_learning_service import answer_doubt, generate_deep_explanation
from app.core.database import get_db
from app.core.security import SECRET_KEY, ALGORITHM

router = APIRouter()

# Global variables for Stateful RAG
active_vector_store = None
pre_fetched_chunks = [] # NAYA: Yahan hum pehle se hi best chunks fetch karke rakhenge
pre_fetched_topics = []
previous_questions = []
current_pdf_name = ""
chunk_pointer = 0
active_runtime_user_id: Optional[str] = None

class GenerateRequest(BaseModel):
    q_type: str
    domain: str
    difficulty: str
    current_q_no: int = 0

class EvaluateRequest(BaseModel):
    question: str
    user_answer: str
    hidden_context: str


def _decode_user_id_from_header(authorization: Optional[str]) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        return user_id if isinstance(user_id, str) else None
    except Exception:
        return None


def _normalize_question(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip().lower())


def _get_runtime_chunk_order(chunks: list[str], current_q_no: int) -> list[str]:
    if not chunks:
        return []
    # Keep storage deterministic; only retrieval order is varied per question.
    span = min(8, len(chunks))
    start = (current_q_no * 3) % len(chunks)
    window = [chunks[(start + i) % len(chunks)] for i in range(span)]
    # Fisher-Yates shuffle for unbiased in-place shuffle.
    for i in range(len(window) - 1, 0, -1):
        j = random.randint(0, i)
        window[i], window[j] = window[j], window[i]
    if len(chunks) <= span:
        return window
    rest = [chunks[(start + span + i) % len(chunks)] for i in range(len(chunks) - span)]
    return window + rest

@router.get("/document-status")
async def document_status():
    """Returns whether a PDF is already processed in the current server session."""
    return {
        "ready": len(pre_fetched_chunks) > 0,
        "chunk_count": len(pre_fetched_chunks),
        "topic_count": len(pre_fetched_topics),
    }


# ==========================================
# API 1: Upload, Analyze Syllabus & Pre-Fetch Chunks
# ==========================================
@router.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    # total_questions: int = Form(...),
    reuse_if_ready: bool = Query(default=False),
    authorization: Optional[str] = Header(default=None),
):
    global active_vector_store, pre_fetched_chunks, current_pdf_name, pre_fetched_topics, previous_questions, active_runtime_user_id

    # Skip expensive PDF parsing when the same in-memory document is already prepared.
    if reuse_if_ready and pre_fetched_chunks and current_pdf_name == file.filename:
        return {
            "success": True,
            "message": "Reusing existing processed document.",
            # "total_questions_set": total_questions,
            "reused": True,
        }

    try:
        contents = await file.read()
        pdf_text = await pdf_text_extractor(contents)
        
        if not pdf_text:
            raise HTTPException(status_code=500, detail="Failed to extract text.")

        chunks = chunk_markdown_text(pdf_text)
        active_vector_store = create_vector_store(chunks)
        current_pdf_name = file.filename

        clean_chunks = []
        for chunk in chunks:
            # Sirf wo paragraph rakho jo 150 characters se bada ho!
            if len(chunk.page_content.strip()) > 150:
                clean_chunks.append(chunk)
        
        chunks = clean_chunks

        # ---------------------------------------------------------
        # NEW PRO ARCHITECTURE: Syllabus Mapping & Dense Fetching
        # ---------------------------------------------------------
        print("🗺️ Mapping Syllabus and Finding Top Topics...")
        
        # 1. Extract all headings from metadata to create a "Table of Contents"
        toc_set = set()
        for chunk in chunks:
            for key, val in chunk.metadata.items():
                if key.startswith("H"): # H1_Main_Title, H2_Chapter etc.
                    toc_set.add(val)
        
        toc_string = ", ".join(list(toc_set))
        if not toc_string.strip():
            toc_string = "General Academic Content" # Fallback if no headers found

        # target_topics = total_questions + 5

        # 2. Ask LLM to pick the most important topics based on TOC
        priority_prompt = f"""
        You are an elite academic curriculum designer and university textbook author. 
        Below is the Table of Contents (TOC) of a specific academic document we are studying:
        [{toc_string}]
        
        Your task is to identify the 15 MOST CRITICAL and dense academic concepts from this TOC that would make for rigorous viva/oral exam questions. Rank them in priority order.
        
        For EACH concept, generate a 'hypothetical_paragraph' (approx 50-80 words). 
        This paragraph must be written EXACTLY as if it were an excerpt pulled directly from a high-level textbook on this specific subject. 
        Use dense academic terminology, a formal tone, and ensure the scientific/academic context STRICTLY ALIGNS with the domain implied by the TOC.

OUTPUT STRICTLY AS A VALID JSON OBJECT WITH A SINGLE KEY "topics" CONTAINING THE ARRAY. 
        NO extra text, NO markdown.
        Example Format:
        {{
            "topics": [
                {{
                    "topic": "Non-Cooperation Movement",
                    "hypothetical_paragraph": "The Non-Cooperation Movement was launched by Mahatma Gandhi in 1920..."
                }}
            ]
        }}
        """

        
        try:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[{"role": "user", "content": priority_prompt}],
                temperature=0.3, 
                response_format={"type": "json_object"}
            )
            
            raw_response = response.choices[0].message.content.strip()
            
            if raw_response.startswith("```json"):
                raw_response = raw_response.replace("```json", "", 1).replace("```", "")
            
            res_json = json.loads(raw_response)
            
            # 🧠 SMART PARSING: LLM ne agar 'topics' ki jagah koi aur key use ki, tab bhi array nikal lo
            if isinstance(res_json, list):
                hyde_topics = res_json
            elif isinstance(res_json, dict):
                # Try 'topics' first, otherwise grab the first list it can find in the dictionary
                hyde_topics = res_json.get("topics") or next((v for v in res_json.values() if isinstance(v, list)), [])
            
            # 🚨 Safety Check: Agar abhi bhi list khali hai, toh explicitly Error raise karo taaki Fallback chale!
            if not hyde_topics:
                raise ValueError("LLM returned an empty array or missing topics.")
                
        except Exception as e:
            print(f"⚠️ HyDE Generation failed, falling back to simple TOC: {e}")
            # The Fallback (Ab 0 chunks wala issue kabhi nahi aayega)
            hyde_topics = [{"topic": t, "hypothetical_paragraph": t} for t in list(toc_set)[:15]]

        print(f"🌟 Generated {len(hyde_topics)} HyDE Contexts successfully!")
        # 3. Pre-fetch using Symmetric Search (HyDE)
        pre_fetched_chunks.clear()
        pre_fetched_topics.clear()
        
        for item in hyde_topics:
            topic_name = item.get("topic", "")
            if topic_name:
                pre_fetched_topics.append(topic_name)
            # THE MAGIC: Hum single word ('topic_name') se search nahi kar rahe, 
            # Hum poore 'hypothetical_paragraph' (Fake Document) se search kar rahe hain!
            search_query = item.get("hypothetical_paragraph", topic_name) 
            
            # Get top 3 chunks matching the Fake Paragraph
            docs = active_vector_store.similarity_search(search_query, k=3)
            
            if docs:
                # Still sort by length to ensure we get the densest chunk among the top matches
                dense_doc = sorted(docs, key=lambda x: len(x.page_content), reverse=True)[0]
                pre_fetched_chunks.append(dense_doc.page_content)

        # Deduplicate while preserving deterministic order.
        seen = set()
        ordered_unique_chunks = []
        for chunk_text in pre_fetched_chunks:
            key = chunk_text.strip()
            if not key or key in seen:
                continue
            seen.add(key)
            ordered_unique_chunks.append(chunk_text)
        pre_fetched_chunks = ordered_unique_chunks

        seen_topics = set()
        ordered_unique_topics = []
        for topic in pre_fetched_topics:
            key = (topic or "").strip()
            if not key or key in seen_topics:
                continue
            seen_topics.add(key)
            ordered_unique_topics.append(key)
        pre_fetched_topics = ordered_unique_topics

        previous_questions = []

        db = get_db()
        user_id = _decode_user_id_from_header(authorization)
        active_runtime_user_id = None
        if db is not None:
            now = datetime.now(timezone.utc)
            source_name = file.filename or "Untitled Document"
            doc = {
                "document_name": source_name,
                "important_topics": pre_fetched_topics,
                "important_chunks": [
                    {
                        "chunk_id": f"chunk_{idx+1}",
                        "chunk_text": text,
                        "topic": pre_fetched_topics[idx % len(pre_fetched_topics)] if pre_fetched_topics else "General",
                    }
                    for idx, text in enumerate(pre_fetched_chunks)
                ],
                "updated_at": now,
            }
            if user_id and ObjectId.is_valid(user_id):
                active_runtime_user_id = user_id
                await db["document_knowledge_bases"].update_one(
                    {"user_id": ObjectId(user_id), "document_name": source_name},
                    {"$set": doc, "$setOnInsert": {"created_at": now}},
                    upsert=True,
                )
            else:
                await db["document_knowledge_bases"].update_one(
                    {"document_name": source_name, "user_id": None},
                    {"$set": {**doc, "user_id": None}, "$setOnInsert": {"created_at": now}},
                    upsert=True,
                )
            await db["viva_sessions"].update_many(
                {"user_id": ObjectId(user_id), "source_file_name": source_name}
                if user_id and ObjectId.is_valid(user_id)
                else {"source_file_name": source_name},
                {"$set": {"important_chunks": doc["important_chunks"], "updated_at": now}},
            )
        
        print(f"📦 Successfully pre-fetched {len(pre_fetched_chunks)} highly accurate chunks using HyDE!")
        # ---------------------------------------------------------

        return {
            "success": True, 
            "message": "PDF Processed and Viva Syllabus Ready!",
            "important_topic_count": len(pre_fetched_topics),
            "important_chunk_count": len(pre_fetched_chunks),
            # "total_questions_set": total_questions
        }
    except Exception as e:
        print(f"Error in upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))



# ==========================================
# API 2: Generate 1 Question (With Auto-Retry & Safety)
# ==========================================
@router.post("/generate")
async def generate_question(req: GenerateRequest):
    global pre_fetched_chunks, chunk_pointer, previous_questions
    if not pre_fetched_chunks:
        raise HTTPException(status_code=400, detail="Please upload a PDF first.")
    if req.current_q_no == 0:
        chunk_pointer = 0
    avoid_questions = {_normalize_question(q) for q in previous_questions if isinstance(q, str)}
    runtime_chunks = _get_runtime_chunk_order(pre_fetched_chunks, req.current_q_no)

    # 🔄 AUTO-RETRY LOOP (Max 4 attempts to avoid junk/repeated questions)
    for attempt in range(4):
        chunk_index = chunk_pointer % len(runtime_chunks)
        chunk_text = runtime_chunks[chunk_index]
        
        # 🚀 THE FIX: Pointer ko turant aage badha do!
        # Isse agar ye chunk JUNK nikla, toh agla attempt khud naye chunk par jayega
        # Aur agar SUCCESS nikla, toh next Question naye chunk se shuru hoga!
        chunk_pointer += 1 


        print("\n" + "="*50)
        print(f"🛑 STOP & READ: Chunk given to AI for Q{req.current_q_no + 1} (Attempt {attempt + 1})")
        print("="*50)
        print(chunk_text[:300] + "...") # Previewing only first 300 chars in terminal
        print("="*50 + "\n")

        avoid_block = ""
        if avoid_questions:
            avoid_list = "\n".join([f"- {q}" for q in list(avoid_questions)[:25]])
            avoid_block = f"""
        6. REPETITION AVOIDANCE: Avoid reusing or paraphrasing previously asked questions:
        {avoid_list}
            """

        prompt = f"""
        You are an elite, notoriously strict University Professor conducting a high-stakes Viva exam.
        Based EXCLUSIVELY on the provided context, generate EXACTLY ONE {req.difficulty}-level {req.q_type} question.
        Focus heavily on the domain: {req.domain}.

        CRITICAL QUALITY RULES (MUST FOLLOW):
        1. JUNK DETECTION: If the context is merely a table of contents, index, promotional filler, or lacks substantial academic theory to form a deep question, output "is_junk": true.
        2. NO GENERIC QUESTIONS: DO NOT ask simple "What is X?" or "Define Y" questions. Test deep conceptual understanding, application, edge-cases, or "Why/How" reasoning.
        3. REAL-WORLD ILLUSION: NEVER use phrases like "According to the text", "Based on the context", or "As mentioned in the paragraph". The question must sound like it is coming naturally from a professor's mind.
        4. PLAUSIBLE DISTRACTORS (If MCQ): If the type is MCQ, the wrong options MUST NOT be obviously wrong. They must represent common student misconceptions or mathematically/logically close errors. 
        5. GROUNDING: The correct answer MUST be 100% provable using ONLY the provided context. Do not hallucinate outside knowledge.
        {avoid_block}

        Output strictly as a valid JSON object ONLY:
        {{
            "is_junk": false,
            "question": "...", // The highly analytical viva question
            "options": ["A...", "B...", "C...", "D..."], // Only if MCQ, else an empty array []
            "correct_answer": "..." // The exact, detailed correct answer expected from a top-tier student
        }}

        CONTEXT:
        {chunk_text}
        """

        try:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            raw_response = response.choices[0].message.content.strip()

            # 🛡️ SAFETY MEASURE: Clean Markdown JSON Tags (Crucial for stability)
            if raw_response.startswith("```json"):
                raw_response = raw_response.replace("```json", "", 1)
                if raw_response.endswith("```"):
                    raw_response = raw_response[:-3]
            elif raw_response.startswith("```"):
                raw_response = raw_response.replace("```", "", 1)
                if raw_response.endswith("```"):
                    raw_response = raw_response[:-3]

            # Parse JSON
            q_data = json.loads(raw_response.strip())

            # ✨ THE QUALITY CHECK ✨
            if not q_data.get("is_junk", False):
                normalized_new = _normalize_question(q_data.get("question", ""))
                if normalized_new and normalized_new in avoid_questions:
                    print(f"🔁 Repeated question rejected on attempt {attempt + 1}.")
                    continue
                print(f"✅ Awesome Question Generated from Chunk {chunk_index + 1}")
                # Inject the context so the Evaluator API knows how to check the answer
                q_data["hidden_context"] = chunk_text 
                if pre_fetched_topics:
                    q_data["topic"] = pre_fetched_topics[chunk_index % len(pre_fetched_topics)]
                previous_questions.append(q_data.get("question", ""))
                return q_data
            else:
                print(f"🗑️ AI rejected Chunk {chunk_index + 1} as JUNK. Trying next chunk...")

        except json.JSONDecodeError:
            print(f"⚠️ Attempt {attempt + 1}: AI returned invalid JSON format. Retrying...")
            continue
        except Exception as e:
            print(f"⚠️ Attempt {attempt + 1}: API Error occurred - {e}")
            continue

    # 🚨 FALLBACK: Agar 3 attempts ke baad bhi kuch na mile (Worst case scenario)
    print("❌ Failed to generate a good question after 3 attempts. Sending fallback.")
    return {
        "question": "Discuss the primary concepts highlighted in this section in detail.",
        "options": [],
        "correct_answer": "Subjective evaluation based on context.",
        "hidden_context": pre_fetched_chunks[req.current_q_no % len(pre_fetched_chunks)]
    }


class ReattemptBootstrapRequest(BaseModel):
    source_file_name: str
    important_topics: list[str]
    important_chunks: list[dict]
    previous_questions: list[str] = []


@router.post("/reattempt/bootstrap")
async def bootstrap_reattempt_runtime(req: ReattemptBootstrapRequest):
    global pre_fetched_chunks, pre_fetched_topics, current_pdf_name, chunk_pointer, previous_questions
    if not req.important_chunks:
        raise HTTPException(status_code=400, detail="Knowledge base is empty.")
    normalized = []
    for idx, item in enumerate(req.important_chunks):
        if isinstance(item, dict):
            text = (item.get("chunk_text") or "").strip()
            topic = (item.get("topic") or "General").strip() or "General"
            if text:
                normalized.append((text, topic))
        elif isinstance(item, str) and item.strip():
            normalized.append((item.strip(), "General"))
    if not normalized:
        raise HTTPException(status_code=400, detail="Knowledge base is empty.")
    pre_fetched_chunks = [t[0] for t in normalized]
    topic_seed = list(req.important_topics or [])
    pre_fetched_topics = topic_seed if topic_seed else [t[1] for t in normalized]
    previous_questions = list(req.previous_questions or [])
    current_pdf_name = req.source_file_name or "Untitled Document"
    chunk_pointer = 0
    return {
        "success": True,
        "ready": True,
        "chunk_count": len(pre_fetched_chunks),
        "topic_count": len(pre_fetched_topics),
    }
    # return {
    #     "question": "Sample Question based on the chunk.",
    #     "options": [],
    #     "correct_answer": "Sample Answer"
    # }

# ==========================================
# API 3: Evaluate Answer
# ==========================================
@router.post("/evaluate")
async def evaluate_answer(req: EvaluateRequest):
    prompt = f"""
    You are an evaluator. 
    Question: {req.question}
    User Answer: {req.user_answer}
    
    Check if the user's answer is correct based ONLY on this context:
    {req.hidden_context}

    Output strictly as JSON:
    {{
        "score": 1, // 1 for correct/partially correct, 0 for wrong
        "feedback": "Explain why it is correct or wrong briefly.",
        "exact_reference": "EXTRACT AND COPY-PASTE the exact sentence from the context that proves the answer. Do not change a single word."
    }}
    """

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        response_format={"type": "json_object"}
    )
    
    return json.loads(response.choices[0].message.content)


# ==========================================
# API 4 & 5: Post-evaluation learning assist
# ==========================================
@router.post("/learning/doubt", response_model=DoubtResponse)
async def learning_ask_doubt(req: DoubtRequest):
    doubt = (req.doubt_message or "").strip()
    if not doubt:
        raise HTTPException(status_code=400, detail="Doubt message cannot be empty.")

    try:
        prior = [{"user": t.user, "assistant": t.assistant} for t in req.prior_doubts]
        answer = await answer_doubt(
            question=req.question,
            user_answer=req.user_answer,
            evaluation_feedback=req.evaluation_feedback,
            evaluation_score=req.evaluation_score,
            exact_reference=req.exact_reference or "",
            hidden_context=req.hidden_context,
            doubt_message=doubt,
            prior_doubts=prior,
        )
        return DoubtResponse(answer=answer)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Failed to answer doubt.") from exc


@router.post("/learning/explain", response_model=ExplainResponse)
async def learning_deep_explanation(req: ExplainRequest):
    try:
        result = await generate_deep_explanation(
            question=req.question,
            user_answer=req.user_answer,
            evaluation_feedback=req.evaluation_feedback,
            evaluation_score=req.evaluation_score,
            exact_reference=req.exact_reference or "",
            hidden_context=req.hidden_context,
        )
        return ExplainResponse(**result)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Failed to generate explanation.") from exc