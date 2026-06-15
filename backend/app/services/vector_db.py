from langchain_community.vectorstores import Chroma
from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2
from langchain_core.documents import Document
import chromadb
import uuid

# Use ChromaDB's built-in ONNX embedding — same all-MiniLM-L6-v2 model
# but runs on onnxruntime instead of PyTorch (saves ~2.4GB on Railway!)
_chroma_ef = ONNXMiniLM_L6_V2()

class _OnnxEmbeddings:
    """Thin LangChain-compatible wrapper around ChromaDB's ONNX embedding function."""
    def embed_documents(self, texts):
        return _chroma_ef(texts)
    def embed_query(self, text):
        return _chroma_ef([text])[0]

_embeddings = _OnnxEmbeddings()

def create_vector_store(chunks):
    """
    Creates an in-memory Chroma vector store from document chunks.
    Uses ONNX-based all-MiniLM-L6-v2 — no PyTorch required.
    """
    client = chromadb.EphemeralClient()
    collection_name = f"viva_{uuid.uuid4().hex[:8]}"

    texts = [chunk.page_content for chunk in chunks]
    metadatas = [chunk.metadata for chunk in chunks]

    vectorstore = Chroma(
        client=client,
        collection_name=collection_name,
        embedding_function=_embeddings,
    )
    vectorstore.add_texts(texts=texts, metadatas=metadatas)
    return vectorstore