from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
import os
from langchain_core.documents import Document

# Hum completely free aur local HuggingFace embeddings use kar rahe hain
# Yeh RAG ke liye sabse fast aur popular open-source model hai
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def create_vector_store(chunks: list[Document], collection_name: str = "viva_docs"):
    """
    Takes text chunks, converts them to vectors, and stores them in ChromaDB.
    """
    try:
        print("🧠 Converting chunks to Vectors & saving to ChromaDB...")
        
        # Hum database ko apne backend folder mein ek 'chroma_db' naam ke folder mein save karenge
        persist_directory = "./chroma_db"
        
        # ChromaDB vector store create karna
        vectorstore = Chroma.from_documents(
            documents=chunks, 
            embedding=embeddings,
            persist_directory=persist_directory,
            collection_name=collection_name
        )
        
        print(f"✅ Successfully stored {len(chunks)} chunks in Vector DB!")
        return vectorstore
        
    except Exception as e:
        print(f"❌ Vector DB creation failed: {e}")
        return None