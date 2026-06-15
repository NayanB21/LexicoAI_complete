from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.database import connect_to_mongo, close_mongo_connection
from app.api.auth import router as auth_router
from app.api.upload import router as upload_router
from app.api.viva import router as viva_router
from app.api.viva_history import router as viva_history_router
from app.core.database import get_db
from app.services.viva_history_service import ensure_viva_history_indexes
import logging
import os
from starlette.requests import Request

# ---------------------------------------------------------------------------
# CORS: Read allowed origins from ALLOWED_ORIGINS env var (comma-separated).
# Falls back to localhost defaults so local dev keeps working without any .env change.
# On Railway, set:  ALLOWED_ORIGINS=https://your-site.netlify.app
# ---------------------------------------------------------------------------
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,https://lexicoai.netlify.app,https://ai-viva-proff-nayan.netlify.app"
)
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

# Basic request logging to diagnose CORS/preflight issues
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lexico_backend")

# Lifespan context manager for startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to Database
    await connect_to_mongo()
    db = get_db()
    if db is not None:
        await ensure_viva_history_indexes(db)
    yield
    # Shutdown: Close Database connection
    await close_mongo_connection()

app = FastAPI(
    title="Lexico AI Backend",
    lifespan=lifespan
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    try:
        headers = dict(request.headers)
        origin = headers.get("origin")
        acl_headers = headers.get("access-control-request-headers")
        acl_method = headers.get("access-control-request-method")
        logger.info(f"Incoming: {request.method} {request.url.path} client={request.client.host} origin={origin} acl_method={acl_method} acl_headers={acl_headers}")
    except Exception:
        logger.exception("Error while logging request")
    response = await call_next(request)
    return response

# CORS setup for React frontend
# Restrict to known frontend origins and allow credentials (cookies/auth headers)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(upload_router, prefix="/api/upload", tags=["Upload"])
app.include_router(viva_router, prefix="/api/viva", tags=["Viva"])
app.include_router(viva_history_router, prefix="/api/viva/history", tags=["Viva History"])
@app.get("/")
async def root():
    return {"message": "Lexico AI Backend is running with MongoDB! 🚀"}