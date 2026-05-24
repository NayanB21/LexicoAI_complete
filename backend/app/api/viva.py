from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
import json

from app.services.pdf_text_extractor import pdf_text_extractor
from app.services.chunking_service import chunk_markdown_text
from app.services.vector_db import create_vector_store
from app.services.ai_examiner import client, MODEL_NAME

router = APIRouter()

# Global variables for Stateful RAG
active_vector_store = None
pre_fetched_chunks = [] # NAYA: Yahan hum pehle se hi best chunks fetch karke rakhenge

class GenerateRequest(BaseModel):
    q_type: str
    domain: str
    difficulty: str
    current_q_no: int = 0

class EvaluateRequest(BaseModel):
    question: str
    user_answer: str
    hidden_context: str

# ==========================================
# API 1: Upload, Analyze Syllabus & Pre-Fetch Chunks
# ==========================================
@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...), total_questions: int = Form(...)):
    global active_vector_store, pre_fetched_chunks
    try:
        contents = await file.read()
        pdf_text = await pdf_text_extractor(contents)
        
        if not pdf_text:
            raise HTTPException(status_code=500, detail="Failed to extract text.")

        chunks = chunk_markdown_text(pdf_text)
        active_vector_store = create_vector_store(chunks)

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

        target_topics = total_questions + 5

        # 2. Ask LLM to pick the most important topics based on TOC
        priority_prompt = f"""
        Here is the Table of Contents / Key Headings of an academic document:
        [{toc_string}]
        
        Identify the top {target_topics} MOST IMPORTANT, dense, and core concepts that would make good viva/exam questions.
        Rank them in priority order.
        
        OUTPUT STRICTLY AS A JSON ARRAY OF STRINGS ONLY.
        Example: ["Thermodynamics", "Newton's First Law", ...]
        """

        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": priority_prompt}],
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        
        # Try to parse the array, handle if LLM wraps it in an object {"topics": [...]}
        res_text = json.loads(response.choices[0].message.content)
        top_topics = res_text if isinstance(res_text, list) else res_text.get("topics", [])
        
        if not isinstance(top_topics, list) or len(top_topics) == 0:
            top_topics = list(toc_set)[:target_topics] # Absolute fallback

        print(f"🌟 AI Prioritized Topics: {top_topics}")

        # 3. Pre-fetch the densest chunk for each priority topic
        pre_fetched_chunks.clear()
        for topic in top_topics:
            # Get top 3 chunks for this specific topic
            docs = active_vector_store.similarity_search(topic, k=3)
            if docs:
                # Sort by length to guarantee we pick the most dense/detailed chunk
                dense_doc = sorted(docs, key=lambda x: len(x.page_content), reverse=True)[0]
                pre_fetched_chunks.append(dense_doc.page_content)
        
        print(f"📦 Successfully pre-fetched {len(pre_fetched_chunks)} highly dense chunks!")
        # ---------------------------------------------------------

        return {
            "success": True, 
            "message": "PDF Processed and Viva Syllabus Ready!",
            "total_questions_set": total_questions
        }
    except Exception as e:
        print(f"Error in upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# API 2: Generate 1 Question (From Pre-Fetched Chunks)
# ==========================================
@router.post("/generate")
async def generate_question(req: GenerateRequest):
    global pre_fetched_chunks
    if not pre_fetched_chunks:
        raise HTTPException(status_code=400, detail="Please upload a PDF first.")

    # 1. Pick the chunk according to the question number
    # Modulo operator prevents array out of bounds if user asks for more questions than we have chunks
    chunk_index = req.current_q_no % len(pre_fetched_chunks)
    chunk_text = pre_fetched_chunks[chunk_index]
    print("\n" + "="*50)
    print(f"🛑 STOP & READ: Chunk given to AI for Q{req.current_q_no + 1}")
    print("="*50)
    print(chunk_text)
    print("="*50 + "\n")
    print(f"📝 Generating Q{req.current_q_no + 1} from Priority Chunk {chunk_index + 1}")

    # 2. Generate Question based on the dense chunk
    prompt = f"""
    Based ONLY on the provided context, generate EXACTLY ONE {req.difficulty} level {req.q_type} question.
    Focus on the domain: {req.domain}.
    
    Output strictly as a JSON object:
    {{
        "question": "...",
        "options": ["A...", "B...", "C...", "D..."], // Only if MCQ, else empty array
        "correct_answer": "..."
    }}

    CONTEXT:
    {chunk_text}
    """

    # response = client.chat.completions.create(
    #     model=MODEL_NAME,
    #     messages=[{"role": "user", "content": prompt}],
    #     temperature=0.3,
    #     response_format={"type": "json_object"}
    # )
    
    # q_data = json.loads(response.choices[0].message.content)
    # q_data["hidden_context"] = chunk_text 
    
    # return q_data
    return {
        "question": "Sample Question based on the chunk.",
        "options": [],
        "correct_answer": "Sample Answer"
    }

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