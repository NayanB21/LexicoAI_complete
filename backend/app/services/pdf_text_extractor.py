import os
import tempfile
import asyncio
from llama_parse import LlamaParse
from dotenv import load_dotenv

load_dotenv()

# LlamaParse SDK expects LLAMA_CLOUD_API_KEY, but this project's .env uses LLAMA_PARSE_API_KEY.
# Read whichever is available.
LLAMA_API_KEY = os.getenv("LLAMA_CLOUD_API_KEY") or os.getenv("LLAMA_PARSE_API_KEY") or ""

async def pdf_text_extractor(pdf_bytes: bytes) -> str:
    """
    Industry-grade LlamaParse extractor that returns perfect Markdown.
    """
    try:
        print("🚀 Starting LlamaParse extraction...")
        
        # 1. RAM mein ek temporary file banate hain
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
            temp_pdf.write(pdf_bytes)
            temp_pdf_path = temp_pdf.name

        # 2. LlamaParse ka engine setup karo (Markdown output ke liye)
        if not LLAMA_API_KEY:
            raise ValueError("LLAMA_PARSE_API_KEY is not set in .env file!")
        
        parser = LlamaParse(
            api_key=LLAMA_API_KEY,
            result_type="markdown",  # RAG ka sabse best format
            verbose=True,
            language="en"
        )

        # 3. PDF ko Cloud par bhej kar text parse karwao
        documents = await parser.aload_data(temp_pdf_path)
        
        # 4. Saare pages ko ek single markdown string mein jod do
        extracted_text = "\n\n".join([doc.text for doc in documents])

        # 5. Kachra saaf karo (Temp file delete)
        os.remove(temp_pdf_path)

        print("✅ LlamaParse extraction successful!")
        return extracted_text.strip()

    except Exception as e:
        print(f"[ERROR] LlamaParse extraction failed: {e}")
        print(f"[HINT] Ensure LLAMA_PARSE_API_KEY is valid in backend/.env")
        # Agar error aati hai temp file delete karna mat bhoolna
        if 'temp_pdf_path' in locals() and os.path.exists(temp_pdf_path):
            os.remove(temp_pdf_path)
        return ""