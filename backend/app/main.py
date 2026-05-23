from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.database import connect_to_mongo, close_mongo_connection
from app.api.auth import router as auth_router
from app.api.upload import router as upload_router
from fastapi.middleware.cors import CORSMiddleware

# Lifespan context manager for startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to Database
    await connect_to_mongo()
    yield
    # Shutdown: Close Database connection
    await close_mongo_connection()

app = FastAPI(
    title="Lexico AI Backend",
    lifespan=lifespan
)

# CORS setup for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(upload_router, prefix="/api/upload", tags=["Upload"])
@app.get("/")
async def root():
    return {"message": "Lexico AI Backend is running with MongoDB! 🚀"}