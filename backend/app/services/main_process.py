from app.services.chunking_service import chunk_markdown_text
from app.services.vector_db import create_vector_store # NAYA IMPORT
from app.services.ai_examiner import generate_viva_questions
from app.services.context_compressor import compress_context

async def main_process(pdf_text: str, settings: dict):
    print("\n" + "="*40)
    print("🧠 Starting Main RAG Process")
    print("="*40)
    print(f"Total Text Length: {len(pdf_text)} characters")
    print(f"Settings Received -> Questions: {settings.get('questions')}")
    
    # Step 1: Text Chunking
    chunks = chunk_markdown_text(pdf_text)
    
    if not chunks:
        print("⚠️ No chunks generated. Process stopped.")
        return False

    # Previewing the first chunk just to see if it works
    print("\n--- Preview of Chunk 1 ---")
    print(chunks[0].page_content[:300] + "...")
    print("--------------------------\n")
    
# Step 2: Create Vector Store (The Memory)
    vector_store = create_vector_store(chunks)
    
    if not vector_store:
        print("⚠️ Failed to create Vector Database. Process stopped.")
        return False
    
# Step 3: Retrieval (Finding the right context)
    print("🔍 Searching for relevant context...")
    # For now, let's just get the top 4 chunks relevant to the domain
    query = """
Important concepts,
definitions,
architectures,
workflows,
applications,
advantages,
limitations,
technical understanding,
reasoning,
comparisons
"""
    # Langchain's similarity_search returns Document objects
    retrieved_docs = vector_store.similarity_search(query, k=3)
    retrieved_docs = sorted(
    retrieved_docs,
    key=lambda x: len(x.page_content),
    reverse=True
)
    print(f"✅ Found {len(retrieved_docs)} relevant chunks.")

# Step 4: Compress Context
    compressed_context = compress_context(
        retrieved_docs
    )

    print("\n--- 🧠 Compressed Context Preview ---")
    print(compressed_context[:500] + "...")
    print("------------------------------------\n")

    # Step 5: Generate Viva Questions
    json_response = generate_viva_questions(
        [compressed_context],
        settings
    )

        # Print the result to the terminal to verify
    print("\n--- 🎓 Generated Viva Questions (JSON) ---")
    print(json_response)
    print("------------------------------------------\n")
    
    return json_response