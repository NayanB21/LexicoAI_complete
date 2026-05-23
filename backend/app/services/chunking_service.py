import re
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter

def clean_markdown_for_splitting(text: str) -> str:
    """
    Pre-processes markdown to fix edge cases before passing to LangChain.
    """
    # Edge Case 1: LlamaParse sometimes bolds headers like **# Chapter 1**
    # Fix: Remove the stars and keep the header -> # Chapter 1
    text = re.sub(r'^\s*\*\*(#+)\s*(.*?)\*\*\s*$', r'\1 \2', text, flags=re.MULTILINE)
    
    # Edge Case 2: Missing space after hash like #Heading instead of # Heading
    # Fix: Add exactly one space after hashes
    text = re.sub(r'^(#+)(?=[^\s#])', r'\1 ', text, flags=re.MULTILINE)
    
    # Edge Case 3: Accidental leading spaces like "  # Heading"
    # Fix: Remove leading spaces before headers
    text = re.sub(r'^\s+(#+)\s+', r'\1 ', text, flags=re.MULTILINE)
    
    # Edge Case 4: Too many empty lines (can create blank chunks)
    # Fix: Normalize 3+ newlines into just 2 newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text

def chunk_markdown_text(markdown_text: str, chunk_size: int = 1500, chunk_overlap: int = 250):
    try:
        print("🧹 Cleaning Markdown to fix Edge Cases...")
        cleaned_text = clean_markdown_for_splitting(markdown_text)
        
        print("🔪 Starting Robust Hierarchical Text Chunking...")
        
        # Deep Hierarchy Definition (Covering from Title down to deepest sub-concepts)
        headers_to_split_on = [
            ("#", "H1_Main_Title"),
            ("##", "H2_Chapter"),
            ("###", "H3_Topic"),
            ("####", "H4_Sub_Topic"),
            ("#####", "H5_Concept"),
            ("######", "H6_Detail"),
        ]
        
        # strip_headers=True is a token-saver! 
        # Yeh heading ko chunk text se hata deta hai kyunki wo pehle hi metadata me aa chuki hai.
        markdown_splitter = MarkdownHeaderTextSplitter(
            headers_to_split_on=headers_to_split_on,
            strip_headers=True 
        )
        
        # Step 1: Split strictly by Headers
        header_splits = markdown_splitter.split_text(cleaned_text)
        
        # Step 2: Ensure no chunk exceeds the AI token limit (Parent-Child constraint)
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""] # Smart fallback sequence
        )
        
        final_chunks = text_splitter.split_documents(header_splits)
        
        # Edge Case 5: Remove any completely empty chunks that might have sneaked through
        final_chunks = [chunk for chunk in final_chunks if chunk.page_content.strip()]
        
        print(f"✅ Text successfully split into {len(final_chunks)} ultra-clean chunks!")
        
        # Previewing the magic
        if final_chunks:
            print("\n--- Preview of Chunk 1 (Ultra-Robust) ---")
            print(f"Metadata: {final_chunks[0].metadata}")
            print(f"Text Preview: {final_chunks[0].page_content[:150]}...")
            print("-----------------------------------------\n")
            
        return final_chunks
        
    except Exception as e:
        print(f"❌ Robust Chunking failed: {e}")
        return []