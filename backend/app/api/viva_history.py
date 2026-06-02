from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from bson import ObjectId

from app.core.database import get_db
from app.core.security import SECRET_KEY, ALGORITHM
from app.models.viva_history import (
    VivaSessionCreateRequest,
    VivaSessionDetail,
    VivaSessionReattemptRequest,
)
from app.services.viva_analysis_service import generate_performance_analysis
from app.services.viva_history_service import (
    append_reattempt,
    create_viva_session,
    get_profile_stats,
    get_source_file_and_questions,
    get_viva_session_by_id,
    list_viva_sessions,
    save_performance_analysis,
)

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def _decode_user_id(token: str) -> str:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise credentials_exception
        return user_id
    except Exception:
        raise credentials_exception


@router.post("", status_code=201)
async def save_viva_session(payload: VivaSessionCreateRequest, token: str = Depends(oauth2_scheme)):
    db = get_db()
    user_id = _decode_user_id(token)
    session_id = await create_viva_session(db, user_id, payload.model_dump())
    return {"success": True, "session_id": session_id}


@router.get("")
async def get_viva_sessions(
    token: str = Depends(oauth2_scheme),
    limit: int = Query(default=30, ge=1, le=100),
    skip: int = Query(default=0, ge=0),
):
    db = get_db()
    user_id = _decode_user_id(token)
    return await list_viva_sessions(db, user_id, limit=limit, skip=skip)


@router.post("/{session_id}/reattempt", status_code=200)
async def save_reattempt(
    session_id: str,
    payload: VivaSessionReattemptRequest,
    token: str = Depends(oauth2_scheme),
):
    db = get_db()
    user_id = _decode_user_id(token)

    if not ObjectId.is_valid(session_id):
        raise HTTPException(status_code=404, detail="Session not found")

    updated = await append_reattempt(db, user_id, session_id, payload.model_dump())
    if not updated:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"success": True, "session_id": session_id}


@router.post("/{session_id}/analysis", status_code=201)
async def generate_viva_performance_analysis(
    session_id: str, token: str = Depends(oauth2_scheme)
):
    db = get_db()
    user_id = _decode_user_id(token)

    if not ObjectId.is_valid(session_id):
        raise HTTPException(status_code=404, detail="Session not found")

    session = await get_viva_session_by_id(db, user_id, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.get("performance_analysis"):
        raise HTTPException(
            status_code=409,
            detail="Performance analysis already exists for this session and cannot be regenerated.",
        )

    try:
        current_attempt = session.get("current_attempt") or {}
        analysis = await generate_performance_analysis(
            {
                "setup": current_attempt.get("setup", {}),
                "result": current_attempt.get("result", {}),
                "history": current_attempt.get("history", []),
                "completion_status": current_attempt.get("completion_status", "completed"),
            }
        )
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=502, detail="Failed to generate performance analysis."
        ) from exc

    saved = await save_performance_analysis(db, user_id, session_id, analysis)
    if not saved:
        existing = await get_viva_session_by_id(db, user_id, session_id)
        if existing and existing.get("performance_analysis"):
            return {
                "success": True,
                "session_id": session_id,
                "performance_analysis": existing["performance_analysis"],
            }
        raise HTTPException(status_code=500, detail="Failed to save performance analysis.")

    stored = await get_viva_session_by_id(db, user_id, session_id)
    return {
        "success": True,
        "session_id": session_id,
        "performance_analysis": stored["performance_analysis"],
    }


@router.get("/{session_id}", response_model=VivaSessionDetail)
async def get_viva_session_detail(session_id: str, token: str = Depends(oauth2_scheme)):
    db = get_db()
    user_id = _decode_user_id(token)

    if not ObjectId.is_valid(session_id):
        raise HTTPException(status_code=404, detail="Session not found")

    session = await get_viva_session_by_id(db, user_id, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/profile/stats")
async def get_viva_profile_stats(token: str = Depends(oauth2_scheme)):
    db = get_db()
    user_id = _decode_user_id(token)
    return await get_profile_stats(db, user_id)


@router.post("/{session_id}/reattempt/start")
async def start_reattempt_runtime(session_id: str, token: str = Depends(oauth2_scheme)):
    db = get_db()
    user_id = _decode_user_id(token)

    if not ObjectId.is_valid(session_id):
        raise HTTPException(status_code=404, detail="Session not found")

    data = await get_source_file_and_questions(db, user_id, session_id)
    if not data:
        raise HTTPException(status_code=404, detail="Session not found")

    stored_chunks = data.get("important_chunks", [])
    if not stored_chunks:
        kb = await db["document_knowledge_bases"].find_one(
            {
                "user_id": ObjectId(user_id),
                "document_name": data["source_file_name"],
            }
        )
        if kb:
            stored_chunks = kb.get("important_chunks", [])
    if not stored_chunks:
        raise HTTPException(
            status_code=404,
            detail="Knowledge base not found for this document. Please upload the PDF again.",
        )

    return {
        "success": True,
        "session_id": session_id,
        "source_file_name": data["source_file_name"],
        "next_attempt_no": data["attempt_count"] + 1,
        "important_topics": list(
            {
                c.get("topic", "General")
                for c in stored_chunks
                if isinstance(c, dict) and (c.get("topic") or "").strip()
            }
        ),
        "important_chunks": stored_chunks,
        "previous_questions": data.get("previous_questions", []),
    }
