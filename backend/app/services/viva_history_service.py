from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId


def _serialize_history_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "title": doc["title"],
        "source_file_name": doc.get("source_file_name"),
        "created_at": doc["created_at"],
        "completed_at": doc["completed_at"],
        "setup": doc["setup"],
        "result": doc["result"],
        "history": doc.get("history", []),
    }


async def ensure_viva_history_indexes(db):
    await db["viva_sessions"].create_index([("user_id", 1), ("created_at", -1)])


async def create_viva_session(db, user_id: str, payload: Dict[str, Any]) -> str:
    now = datetime.now(timezone.utc)
    session_doc = {
        "user_id": ObjectId(user_id),
        "title": payload["title"],
        "source_file_name": payload.get("source_file_name"),
        "created_at": now,
        "completed_at": now,
        "updated_at": now,
        "setup": payload["setup"],
        "result": payload["result"],
        "history": payload["history"],
    }
    result = await db["viva_sessions"].insert_one(session_doc)
    return str(result.inserted_id)


async def list_viva_sessions(db, user_id: str, limit: int = 30, skip: int = 0) -> List[Dict[str, Any]]:
    cursor = (
        db["viva_sessions"]
        .find({"user_id": ObjectId(user_id)})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    docs = await cursor.to_list(length=limit)
    return [
        {
            "id": str(doc["_id"]),
            "title": doc["title"],
            "created_at": doc["created_at"],
            "completed_at": doc["completed_at"],
            "score": doc["result"]["score"],
            "total": doc["result"]["total"],
            "difficulty": doc["setup"]["difficulty"],
            "question_type": doc["setup"]["question_type"],
            "total_questions": doc["setup"]["total_questions"],
        }
        for doc in docs
    ]


async def get_viva_session_by_id(db, user_id: str, session_id: str) -> Optional[Dict[str, Any]]:
    doc = await db["viva_sessions"].find_one(
        {"_id": ObjectId(session_id), "user_id": ObjectId(user_id)}
    )
    if not doc:
        return None
    return _serialize_history_doc(doc)
