import os
import tempfile
import asyncio
from llama_parse import LlamaParse
from dotenv import load_dotenv

load_dotenv()

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
        parser = LlamaParse(
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
        print(f"❌ LlamaParse extraction failed: {e}")
        # Agar error aati hai temp file delete karna mat bhoolna
        if 'temp_pdf_path' in locals() and os.path.exists(temp_pdf_path):
            os.remove(temp_pdf_path)
        return ""