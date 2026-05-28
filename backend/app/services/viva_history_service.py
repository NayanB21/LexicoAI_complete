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
        "completion_status": doc.get("completion_status", "completed"),
        "attempt_no": doc.get("attempt_no", 1),
        "reattempt_count": doc.get("reattempt_count", 0),
        "attempts": doc.get("attempts", []),
        "performance_analysis": doc.get("performance_analysis"),
        "has_analysis": doc.get("performance_analysis") is not None,
    }


async def ensure_viva_history_indexes(db):
    await db["viva_sessions"].create_index([("user_id", 1), ("created_at", -1)])
    await db["viva_sessions"].create_index([("user_id", 1), ("source_file_name", 1)])


def _build_attempt_record(attempt_no: int, payload: Dict[str, Any], completed_at: datetime) -> Dict[str, Any]:
    return {
        "attempt_no": attempt_no,
        "completion_status": payload.get("completion_status", "completed"),
        "score": payload["result"]["score"],
        "total": payload["result"]["total"],
        "attempted_questions": payload["result"].get("attempted_questions", 0),
        "average_score": payload["result"].get("average_score", 0.0),
        "completed_at": completed_at,
        "history": payload.get("history", []),
    }


async def create_viva_session(db, user_id: str, payload: Dict[str, Any]) -> str:
    now = datetime.now(timezone.utc)
    source_name = payload.get("source_file_name") or payload.get("title") or "Untitled Document"

    existing_count = await db["viva_sessions"].count_documents(
        {"user_id": ObjectId(user_id), "source_file_name": source_name}
    )
    attempt_no = payload.get("attempt_no") or (existing_count + 1)
    display_title = payload.get("title") or f"{source_name} · Attempt {attempt_no}"

    payload_with_attempt = {**payload, "attempt_no": attempt_no}
    first_attempt = _build_attempt_record(attempt_no, payload_with_attempt, now)

    session_doc = {
        "user_id": ObjectId(user_id),
        "title": display_title,
        "source_file_name": source_name,
        "created_at": now,
        "completed_at": now,
        "updated_at": now,
        "setup": payload["setup"],
        "result": payload["result"],
        "history": payload["history"],
        "completion_status": payload.get("completion_status", "completed"),
        "attempt_no": attempt_no,
        "reattempt_count": max(0, attempt_no - 1),
        "attempts": [first_attempt],
    }
    result = await db["viva_sessions"].insert_one(session_doc)
    return str(result.inserted_id)


async def append_reattempt(db, user_id: str, session_id: str, payload: Dict[str, Any]) -> bool:
    doc = await db["viva_sessions"].find_one(
        {"_id": ObjectId(session_id), "user_id": ObjectId(user_id)}
    )
    if not doc:
        return False

    now = datetime.now(timezone.utc)
    attempts = doc.get("attempts", [])
    next_no = len(attempts) + 1
    new_attempt = _build_attempt_record(next_no, payload, now)

    await db["viva_sessions"].update_one(
        {"_id": ObjectId(session_id)},
        {
            "$set": {
                "completed_at": now,
                "updated_at": now,
                "result": payload["result"],
                "history": payload["history"],
                "completion_status": payload.get("completion_status", "completed"),
                "reattempt_count": next_no - 1,
            },
            "$push": {"attempts": new_attempt},
        },
    )
    return True


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
            "attempted_questions": doc["result"].get("attempted_questions", doc["result"]["total"]),
            "difficulty": doc["setup"]["difficulty"],
            "question_type": doc["setup"]["question_type"],
            "total_questions": doc["setup"]["total_questions"],
            "completion_status": doc.get("completion_status", "completed"),
            "attempt_no": doc.get("attempt_no", 1),
            "source_file_name": doc.get("source_file_name"),
            "reattempt_count": doc.get("reattempt_count", 0),
            "has_analysis": doc.get("performance_analysis") is not None,
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


async def save_performance_analysis(
    db, user_id: str, session_id: str, analysis: Dict[str, Any]
) -> bool:
    now = datetime.now(timezone.utc)
    analysis_with_meta = {**analysis, "generated_at": now}

    result = await db["viva_sessions"].update_one(
        {
            "_id": ObjectId(session_id),
            "user_id": ObjectId(user_id),
            "performance_analysis": {"$exists": False},
        },
        {"$set": {"performance_analysis": analysis_with_meta, "updated_at": now}},
    )
    return result.modified_count > 0
