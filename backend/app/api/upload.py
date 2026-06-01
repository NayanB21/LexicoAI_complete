from fastapi import APIRouter, Form, UploadFile, File,HTTPException
# import io
# from app.services.main_process import main_process
from app.services.pdf_text_extractor import pdf_text_extractor
from app.services.main_process import main_process

router = APIRouter()


@router.post("/")
async def upload_document(

    file: UploadFile = File(...),

    # difficulty: str = Form(...),
    # questions: str = Form(...),
    # voiceMode: str = Form(...),
    # counterQuestions: str = Form(...)

):

    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # Read uploaded PDF bytes
    contents = await file.read()

    # NAYA: Stream ki jagah seedha bytes bhej rahe hain (LlamaParse ke liye)
    pdf_text = await pdf_text_extractor(contents)
    if not pdf_text:
        raise HTTPException(status_code=500, detail="Failed to extract text from PDF.")

    # 🌟 FIX: Saari settings ko ek Dictionary mein pack karo
    # user_settings = {
    #     # "difficulty": difficulty,
    #     # "questions": questions,
    #     # "voiceMode": voiceMode,
    #     # "counterQuestions": counterQuestions,
    #     "type": "MCQ",       # Default for now (can be passed from frontend later)
    #     "domain": "General"  # Default for now (can be passed from frontend later)
    # }
    # Process the PDF
    result = await main_process(pdf_text,)

    return {
        "success": True,
        # "questions": result, # AI ke generate kiye hue questions wapas bhej rahe hain
        # "text_preview": pdf_text[:500],
    }