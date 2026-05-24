from app.services.chunking_service import chunk_markdown_text
from app.services.vector_db import create_vector_store 
from app.services.ai_examiner import generate_single_question
from app.services.content_filter import extract_badhiya_content # ✨ NAYA IMPORT
import json

async def main_process(pdf_text: str, settings: dict):
    print("\n" + "="*40)
    print("🧠 Starting Main RAG Process (1 Chunk = 1 Question)")
    print("="*40)
    print(f"Total Text Length: {len(pdf_text)} characters")
    print(f"Settings Received -> Questions: {settings.get('questions')}")
    
    # Step 1: Text Chunking
    chunks = chunk_markdown_text(pdf_text)
    
    if not chunks:
        print("⚠️ No chunks generated. Process stopped.")
        return False

    print(f"📊 Total Raw Chunks generated: {len(chunks)}")

    # ✨ THE QUALITY GATE (Filter logic added here) ✨
    filtered_good_chunks = extract_badhiya_content(chunks)
    print(f"💎 Pure Quality Chunks remaining: {len(filtered_good_chunks)}")

    if not filtered_good_chunks:
        print("⚠️ No quality chunks left after filtering. Process stopped.")
        return False

    # Previewing the first chunk just to see if it works
    print("\n--- Preview of Quality Chunk 1 ---")
    print(filtered_good_chunks[0].page_content[:300] + "...")
    print("--------------------------\n")
    
    # Step 2: Create Vector Store (The Memory)
    # 🛑 Yahan sirf filtered chunks pass karne hain!
    vector_store = create_vector_store(filtered_good_chunks)
    
    if not vector_store:
        print("⚠️ Failed to create Vector Database. Process stopped.")
        return False
    
    # Step 3: Retrieval (Finding the right context)
    print("🔍 Searching for relevant context...")
    num_questions = int(settings.get("questions", 5))
    
    # User ke domain ke hisaab se sabse best chunks nikal rahe hain
    query = f"Important concepts related to {settings.get('domain', 'General')}"
    
    # Hum utne hi chunks nikalenge jitne questions user ko chahiye
    retrieved_docs = vector_store.similarity_search(query, k=num_questions)

    print(f"✅ Found {len(retrieved_docs)} relevant chunks.")

    # Step 4: Generate 1 Question per Chunk (Zero Hallucination Loop)
    final_questions = []
    print(f"\n🧠 Generating {len(retrieved_docs)} questions (1 per chunk)...")
    
    for idx, doc in enumerate(retrieved_docs):
        # Yahan AI se question generate ho kar string format me aata hai
        # (Dhyan rakhna, agar tumhara function list of strings mangta hai toh [doc.page_content] bhejna)
        q_string = generate_single_question(doc.page_content, settings) 
        
        if q_string:
            try:
                # 1. String ko Python list/dictionary mein convert karo
                q_parsed = json.loads(q_string)
                
                # 2. Agar AI ne list bheji hai (eg: [ {"question": "..."} ]), toh pehla item nikal lo
                if isinstance(q_parsed, list) and len(q_parsed) > 0:
                    q_dict = q_parsed[0]
                else:
                    q_dict = q_parsed # Agar seedha dictionary aayi hai toh
                
                # 3. Ab hidden context inject karo (Kyunki ab ye pakka dictionary hai)
                q_dict["hidden_source_context"] = doc.page_content 
                
                final_questions.append(q_dict)
                print(f"✅ Question {idx+1} generated successfully.")
                
            except json.JSONDecodeError:
                print(f"❌ Failed to parse JSON for Question {idx+1}. AI output was not valid JSON.")
        else:
            print(f"❌ Failed to generate Question {idx+1}.")

    # Print the final array of questions to the terminal
    print("\n--- 🎓 Final Generated Questions (JSON Array) ---")
    print(json.dumps(final_questions, indent=2))
    print("------------------------------------------------\n")
    
    return final_questions