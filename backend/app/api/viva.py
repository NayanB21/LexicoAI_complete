from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from pydantic import BaseModel
import json

from app.services.pdf_text_extractor import pdf_text_extractor
from app.services.chunking_service import chunk_markdown_text
from app.services.vector_db import create_vector_store
from app.services.ai_examiner import client, MODEL_NAME
from app.models.viva_learning import DoubtRequest, DoubtResponse, ExplainRequest, ExplainResponse
from app.services.viva_learning_service import answer_doubt, generate_deep_explanation

router = APIRouter()

# Global variables for Stateful RAG
active_vector_store = None
pre_fetched_chunks = [] # NAYA: Yahan hum pehle se hi best chunks fetch karke rakhenge
current_pdf_name = ""
chunk_pointer = 0

class GenerateRequest(BaseModel):
    q_type: str
    domain: str
    difficulty: str
    current_q_no: int = 0

class EvaluateRequest(BaseModel):
    question: str
    user_answer: str
    hidden_context: str

@router.get("/document-status")
async def document_status():
    """Returns whether a PDF is already processed in the current server session."""
    return {
        "ready": len(pre_fetched_chunks) > 0,
        "chunk_count": len(pre_fetched_chunks),
    }


# ==========================================
# API 1: Upload, Analyze Syllabus & Pre-Fetch Chunks
# ==========================================
@router.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    # total_questions: int = Form(...),
    reuse_if_ready: bool = Query(default=False),
):
    global active_vector_store, pre_fetched_chunks

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

        OUTPUT STRICTLY AS A VALID JSON ARRAY OF OBJECTS ONLY. NO extra text, NO markdown.
        Example Format:
        [
            {{
                "topic": "Newton's First Law",
                "hypothetical_paragraph": "Newton's first law of motion, often referred to as the law of inertia, postulates that a physical body will remain at rest, or continue to move at a constant velocity in a straight line, unless acted upon by a net external force. This principle establishes the fundamental relationship between force and the state of motion..."
            }}
        ]
        """

        
        try:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[{"role": "user", "content": priority_prompt}],
                temperature=0.3, # Thoda sa creative freedom diya taaki paragraph achha likhe
                response_format={"type": "json_object"}
            )
            
            raw_response = response.choices[0].message.content.strip()
            
            # Clean Markdown if exists (safety)
            if raw_response.startswith("```json"):
                raw_response = raw_response.replace("```json", "", 1).replace("```", "")
            
            res_json = json.loads(raw_response)
            
            # Handle array vs object response from LLM
            hyde_topics = res_json if isinstance(res_json, list) else res_json.get("topics", [])
            
        except Exception as e:
            print(f"⚠️ HyDE Generation failed, falling back to simple TOC: {e}")
            hyde_topics = [{"topic": t, "hypothetical_paragraph": t} for t in list(toc_set)[:15]]

        print(f"🌟 Generated {len(hyde_topics)} HyDE Contexts successfully!")

        # 3. Pre-fetch using Symmetric Search (HyDE)
        pre_fetched_chunks.clear()
        
        for item in hyde_topics:
            topic_name = item.get("topic", "")
            # THE MAGIC: Hum single word ('topic_name') se search nahi kar rahe, 
            # Hum poore 'hypothetical_paragraph' (Fake Document) se search kar rahe hain!
            search_query = item.get("hypothetical_paragraph", topic_name) 
            
            # Get top 3 chunks matching the Fake Paragraph
            docs = active_vector_store.similarity_search(search_query, k=3)
            
            if docs:
                # Still sort by length to ensure we get the densest chunk among the top matches
                dense_doc = sorted(docs, key=lambda x: len(x.page_content), reverse=True)[0]
                pre_fetched_chunks.append(dense_doc.page_content)
        
        print(f"📦 Successfully pre-fetched {len(pre_fetched_chunks)} highly accurate chunks using HyDE!")
        # ---------------------------------------------------------

        return {
            "success": True, 
            "message": "PDF Processed and Viva Syllabus Ready!",
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
    global pre_fetched_chunks,chunk_pointer
    if not pre_fetched_chunks:
        raise HTTPException(status_code=400, detail="Please upload a PDF first.")
    if req.current_q_no == 0:
        chunk_pointer = 0
    # 🔄 AUTO-RETRY LOOP (Max 3 attempts to avoid bad chunks or API failures)
    for attempt in range(3):
        chunk_index = chunk_pointer % len(pre_fetched_chunks)
        chunk_text = pre_fetched_chunks[chunk_index]
        
        # 🚀 THE FIX: Pointer ko turant aage badha do!
        # Isse agar ye chunk JUNK nikla, toh agla attempt khud naye chunk par jayega
        # Aur agar SUCCESS nikla, toh next Question naye chunk se shuru hoga!
        chunk_pointer += 1 


        print("\n" + "="*50)
        print(f"🛑 STOP & READ: Chunk given to AI for Q{req.current_q_no + 1} (Attempt {attempt + 1})")
        print("="*50)
        print(chunk_text[:300] + "...") # Previewing only first 300 chars in terminal
        print("="*50 + "\n")

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
                print(f"✅ Awesome Question Generated from Chunk {chunk_index + 1}")
                # Inject the context so the Evaluator API knows how to check the answer
                q_data["hidden_context"] = chunk_text 
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