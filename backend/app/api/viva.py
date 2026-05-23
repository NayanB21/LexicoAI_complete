from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
import json

# Tumhari existing services
from app.services.pdf_text_extractor import pdf_text_extractor
from app.services.chunking_service import chunk_markdown_text
from app.services.vector_db import create_vector_store
from app.services.ai_examiner import client, MODEL_NAME # Import Groq/OpenRouter client

router = APIRouter()

# Global variable to hold VectorDB temporarily (For MVP purposes)
# Production mein hum isko Redis ya User ID ke sath MongoDB mein link karenge
active_vector_store = None

# --- Pydantic Models for APIs ---
class GenerateRequest(BaseModel):
    q_type: str
    domain: str
    difficulty: str

class EvaluateRequest(BaseModel):
    question: str
    user_answer: str
    hidden_context: str

# ==========================================
# API 1: Upload & Prepare Database
# ==========================================
@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...), total_questions: int = Form(...)):
    global active_vector_store
    try:
        contents = await file.read()
        pdf_text = await pdf_text_extractor(contents)
        
        if not pdf_text:
            raise HTTPException(status_code=500, detail="Failed to extract text.")

        chunks = chunk_markdown_text(pdf_text)
        active_vector_store = create_vector_store(chunks)

        return {
            "success": True, 
            "message": "PDF Processed and Vector DB Ready!",
            "total_questions_set": total_questions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# API 2: Generate 1 Question
# ==========================================
@router.post("/generate")
async def generate_question(req: GenerateRequest):
    global active_vector_store
    if not active_vector_store:
        raise HTTPException(status_code=400, detail="Please upload a PDF first.")

    # Search Vector DB based on domain
    query = f"Important concepts related to {req.domain}"
    docs = active_vector_store.similarity_search(query, k=1) # Sirf top 1 chunk uthayenge
    chunk_text = docs[0].page_content

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

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"}
    )
    
    q_data = json.loads(response.choices[0].message.content)
    # The Magic: Saving context for evaluation
    q_data["hidden_context"] = chunk_text 
    
    return q_data

# ==========================================
# API 3: Evaluate Answer & Give Reference
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
        temperature=0.1, # Lowest temp so it strictly copy-pastes
        response_format={"type": "json_object"}
    )
    
    eval_data = json.loads(response.choices[0].message.content)
    return eval_data