from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from bson import ObjectId

from app.core.database import get_db
from app.core.security import SECRET_KEY, ALGORITHM
from app.models.viva_history import (
    VivaSessionCreateRequest,
    VivaSessionDetail,
    VivaSessionListItem,
    VivaSessionReattemptRequest,
)
from app.services.viva_history_service import (
    append_reattempt,
    create_viva_session,
    get_viva_session_by_id,
    list_viva_sessions,
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


@router.get("", response_model=list[VivaSessionListItem])
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
