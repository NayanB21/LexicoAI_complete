# Lexico AI 🚀

### AI-Powered Viva Preparation Platform using RAG, HyDE Retrieval & Automated Evaluation

Lexico AI is an end-to-end AI-powered viva examination platform that transforms PDF study materials into interactive examination sessions.

The system uses a Retrieval-Augmented Generation (RAG) pipeline, HyDE-based retrieval, semantic search, automated answer evaluation, and AI-powered learning assistance to help students prepare for viva examinations more effectively.

---

## 🌟 Features

### 📄 PDF-to-Viva Pipeline

* Upload notes, or study materials
* Automatic PDF text extraction
* Intelligent content chunking
* Noise filtering and content quality validation

### 🧠 Advanced RAG System

* Chroma Vector Database
* HuggingFace Embeddings
* Semantic Search
* HyDE (Hypothetical Document Embeddings) Retrieval
* Context Compression

### 🎤 AI Viva Generation

* Dynamic question generation
* Topic-aware questioning
* Repetition prevention
* Grounded questions based on uploaded material

### ✅ Automated Answer Evaluation

* AI-based answer assessment
* Evidence-based grading
* Exact reference extraction
* Detailed feedback generation

### 📚 Learning Assistant

* Ask doubts after evaluation
* Deep concept explanations
* Context-aware learning support

### 📊 Performance Analytics

* Session history tracking
* Performance analysis
* Progress monitoring
* AI-generated learning reports

### 🔐 Authentication System

* JWT Authentication
* User registration & login
* Profile management
* Protected routes

---

# 🏗 System Architecture

```text
                    +----------------------+
                    |      Frontend        |
                    |   React + Vite       |
                    +----------+-----------+
                               |
                               |
                               v
                    +----------------------+
                    |      FastAPI API     |
                    | Authentication       |
                    | Viva Generation      |
                    | Evaluation Engine    |
                    +----------+-----------+
                               |
          ------------------------------------------
          |                    |                  |
          v                    v                  v

 +----------------+   +----------------+   +----------------+
 |   MongoDB      |   |   ChromaDB     |   |  Groq LLM API  |
 | User Data      |   | Vector Store   |   | Question Gen   |
 | Session Data   |   | Retrieval      |   | Evaluation     |
 +----------------+   +----------------+   +----------------+

                               ^
                               |
                     +------------------+
                     | HuggingFace      |
                     | Embeddings       |
                     | all-MiniLM       |
                     +------------------+
```

---

# 🔄 End-to-End Workflow

## 1. PDF Upload

User uploads study material.

```text
PDF
 ↓
LlamaParse
 ↓
Raw Extracted Text with headings
```

---

## 2. Chunking & Cleaning

```text
Extracted Text
 ↓
Header-Aware Splitting
 ↓
Recursive Chunking
 ↓
Content Filtering
 ↓
High Quality Chunks
```

---

## 3. Vector Database Creation

```text
Chunks
 ↓
HuggingFace Embeddings
 ↓
Chroma Vector Store
```

---

## 4. HyDE Retrieval

Instead of directly searching chunks:

```text
Document Topics
 ↓
LLM Generates Hypothetical Paragraphs
 ↓
Semantic Search
 ↓
Most Relevant Chunks Retrieved
```

This improves retrieval precision and question quality.

---

## 5. Viva Question Generation

```text
Retrieved Chunk
 ↓
LLM
 ↓
Grounded Viva Question
```

Each question is generated from a specific context chunk to reduce hallucinations.

---

## 6. Answer Evaluation

```text
Student Answer
 +
Expected Answer
 +
Source Context
 ↓
AI Evaluation Engine
 ↓
Score + Feedback + Evidence
```

---

## 7. Learning Assistance

After evaluation:

```text
Feedback
 +
Source Context
 ↓
AI Tutor
 ↓
Explanation / Doubt Solving
```

---

# 🛠 Tech Stack

## Frontend

* React
* Vite
* React Router
* Context API
* Custom Hooks

## Backend

* FastAPI
* Python
* JWT Authentication
* Motor (Async MongoDB)

## AI & RAG

* Groq LLM
* HuggingFace Embeddings
* ChromaDB
* LangChain
* HyDE Retrieval
* Context Compression

## Database

* MongoDB

## Deployment

* Netlify (Frontend)
* Railway (Backend)

---

# 📂 Project Structure

```text
LexicoAI_complete/

├── frontend/
│   ├── src/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   └── services/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── services/
│   │   ├── core/
│   │   ├── models/
│   │   └── utils/
│   │
│   ├── chroma_db/
│   └── requirements.txt
│
└── README.md
```

---

# 🚀 Local Setup

## Clone Repository

```bash
git clone https://github.com/KartikGupta747/LexicoAI_complete.git
cd LexicoAI_complete
```

---

## Backend Setup

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt
```

Create:

```env
.env
```

```env
MONGODB_URL=your_mongodb_url

SECRET_KEY=your_secret_key

GROQ_API_KEY=your_groq_api_key

LLAMA_PARSE_API_KEY=your_llamaparse_key
```

Run:

```bash
uvicorn app.main:app --reload
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Create:

```env
.env
```

```env
VITE_API_BASE_URL=http://localhost:8000
```


# 🎯 Key Engineering Highlights

### HyDE Retrieval Strategy

Instead of directly searching vector embeddings:

1. Generate hypothetical topic descriptions
2. Search those descriptions in vector DB
3. Retrieve semantically richer context

Result:

* Better recall
* Better question quality
* More focused retrieval

---

### Hallucination Reduction

Implemented multiple safeguards:

* Single-chunk grounding
* Exact reference extraction
* Low-temperature generation
* Strict JSON outputs
* Repetition detection

---

### Automated Evaluation Engine

Evaluation is based on:

* Student Answer
* Expected Answer
* Source Context

This prevents evaluation from relying purely on LLM memory.


# 👨‍💻 Author

### Kartik Gupta

B.Tech, Industrial & Systems Engineering
IIT Kharagpur

---

# ⭐ If you like this project

Give the repository a ⭐ and feel free to contribute.

---
