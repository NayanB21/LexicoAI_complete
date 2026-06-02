from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId


def _normalize_attempt_record(attempt: Dict[str, Any], fallback_no: int) -> Dict[str, Any]:
    result = attempt.get("result", {})
    setup = attempt.get("setup", {})
    history = attempt.get("history", [])
    started_at = attempt.get("started_at") or attempt.get("completed_at") or datetime.now(timezone.utc)
    completed_at = attempt.get("completed_at") or datetime.now(timezone.utc)
    return {
        "attempt_no": int(attempt.get("attempt_no") or fallback_no),
        "started_at": started_at,
        "completed_at": completed_at,
        "completion_status": attempt.get("completion_status", "completed"),
        "setup": {
            "difficulty": setup.get("difficulty", "Medium"),
            "question_type": setup.get("question_type", "MCQ"),
            "total_questions": int(setup.get("total_questions") or result.get("total") or 10),
            "mode": setup.get("mode", "text"),
        },
        "result": {
            "score": int(result.get("score") or attempt.get("score") or 0),
            "total": int(result.get("total") or attempt.get("total") or 0),
            "attempted_questions": int(
                result.get("attempted_questions")
                or attempt.get("attempted_questions")
                or len(history)
            ),
            "average_score": float(
                result.get("average_score")
                or attempt.get("average_score")
                or 0.0
            ),
        },
        "history": history,
    }


def _serialize_history_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    attempts = [
        _normalize_attempt_record(a, idx + 1) for idx, a in enumerate(doc.get("attempts", []))
    ]
    current_attempt_no = int(doc.get("current_attempt_no") or (len(attempts) if attempts else 1))
    current_attempt = next((a for a in attempts if a["attempt_no"] == current_attempt_no), None)
    if not current_attempt and attempts:
        current_attempt = attempts[-1]

    return {
        "id": str(doc["_id"]),
        "title": doc["title"],
        "source_file_name": doc.get("source_file_name"),
        "created_at": doc["created_at"],
        "updated_at": doc.get("updated_at", doc["created_at"]),
        "current_attempt_no": current_attempt_no,
        "reattempt_count": doc.get("reattempt_count", 0),
        "attempts": attempts,
        "current_attempt": current_attempt,
        "performance_analysis": doc.get("performance_analysis"),
        "has_analysis": doc.get("performance_analysis") is not None,
    }


async def ensure_viva_history_indexes(db):
    await db["viva_sessions"].create_index([("user_id", 1), ("created_at", -1)])
    await db["viva_sessions"].create_index([("user_id", 1), ("source_file_name", 1)])
    await db["document_knowledge_bases"].create_index(
        [("user_id", 1), ("document_name", 1)], unique=True
    )
    await migrate_viva_sessions_schema(db)


def _build_attempt_record(
    attempt_no: int, payload: Dict[str, Any], started_at: datetime, completed_at: datetime
) -> Dict[str, Any]:
    return {
        "attempt_no": attempt_no,
        "started_at": payload.get("started_at", started_at),
        "completed_at": payload.get("completed_at", completed_at),
        "completion_status": payload.get("completion_status", "completed"),
        "setup": payload["setup"],
        "result": payload["result"],
        "history": payload.get("history", []),
    }


async def create_viva_session(db, user_id: str, payload: Dict[str, Any]) -> str:
    now = datetime.now(timezone.utc)
    source_name = payload.get("source_file_name") or payload.get("title") or "Untitled Document"

    display_title = payload.get("title") or source_name
    attempt_no = 1
    first_attempt = _build_attempt_record(attempt_no, payload, now, now)

    kb = await db["document_knowledge_bases"].find_one(
        {"user_id": ObjectId(user_id), "document_name": source_name}
    )
    important_chunks = kb.get("important_chunks", []) if kb else []

    session_doc = {
        "user_id": ObjectId(user_id),
        "title": display_title,
        "source_file_name": source_name,
        "important_chunks": important_chunks,
        "created_at": now,
        "updated_at": now,
        "current_attempt_no": 1,
        "reattempt_count": 0,
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
    if not payload.get("setup"):
        last_attempt = attempts[-1] if attempts else {}
        payload["setup"] = (
            last_attempt.get("setup")
            or {"difficulty": "Medium", "question_type": "MCQ", "total_questions": 10, "mode": "text"}
        )
    new_attempt = _build_attempt_record(next_no, payload, now, now)

    await db["viva_sessions"].update_one(
        {"_id": ObjectId(session_id)},
        {
            "$set": {
                "updated_at": now,
                "current_attempt_no": next_no,
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
    )
    docs = await cursor.to_list(length=None)
    rows: List[Dict[str, Any]] = []
    for doc in docs:
        attempts = [
            _normalize_attempt_record(a, idx + 1) for idx, a in enumerate(doc.get("attempts", []))
        ]
        for attempt in attempts:
            rows.append(
                {
                    "id": f'{str(doc["_id"])}:{attempt["attempt_no"]}',
                    "session_id": str(doc["_id"]),
                    "title": doc["title"],
                    "created_at": doc["created_at"],
                    "started_at": attempt["started_at"],
                    "completed_at": attempt["completed_at"],
                    "score": attempt["result"]["score"],
                    "total": attempt["result"]["total"],
                    "attempted_questions": attempt["result"]["attempted_questions"],
                    "difficulty": attempt["setup"]["difficulty"],
                    "question_type": attempt["setup"]["question_type"],
                    "total_questions": attempt["setup"]["total_questions"],
                    "completion_status": attempt["completion_status"],
                    "attempt_no": attempt["attempt_no"],
                    "source_file_name": doc.get("source_file_name"),
                    "reattempt_count": doc.get("reattempt_count", 0),
                    "has_analysis": doc.get("performance_analysis") is not None,
                }
            )
    rows.sort(key=lambda x: x.get("completed_at") or x.get("started_at"), reverse=True)
    return rows[skip : skip + limit]


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


async def get_source_file_and_questions(
    db, user_id: str, session_id: str
) -> Optional[Dict[str, Any]]:
    doc = await db["viva_sessions"].find_one(
        {"_id": ObjectId(session_id), "user_id": ObjectId(user_id)}
    )
    if not doc:
        return None

    source_name = doc.get("source_file_name") or doc.get("title") or "Untitled Document"
    previous_questions: List[str] = []

    for attempt in doc.get("attempts", []):
        for item in attempt.get("history", []):
            question = (item or {}).get("q")
            if isinstance(question, str) and question.strip():
                previous_questions.append(question.strip())

    return {
        "source_file_name": source_name,
        "attempt_count": len(doc.get("attempts", [])),
        "previous_questions": previous_questions,
        "important_chunks": doc.get("important_chunks", []),
    }


async def get_profile_stats(db, user_id: str) -> Dict[str, Any]:
    pipeline = [
        {"$match": {"user_id": ObjectId(user_id)}},
        {
            "$project": {
                "source_file_name": {"$ifNull": ["$source_file_name", "$title"]},
                "attempts": {"$ifNull": ["$attempts", []]},
            }
        },
        {"$unwind": {"path": "$attempts", "preserveNullAndEmptyArrays": False}},
        {
            "$project": {
                "attempt_no": "$attempts.attempt_no",
                "source_file_name": 1,
                "completion_status": "$attempts.completion_status",
                "attempted_questions": {"$ifNull": ["$attempts.result.attempted_questions", 0]},
                "score": {"$ifNull": ["$attempts.result.score", 0]},
                "completed_at": "$attempts.completed_at",
                "history": {"$ifNull": ["$attempts.history", []]},
            }
        },
        {
            "$addFields": {
                "history_count": {"$size": "$history"},
                "score_percentage": {
                    "$cond": [
                        {"$gt": [{"$size": "$history"}, 0]},
                        {
                            "$multiply": [
                                {"$divide": ["$score", {"$size": "$history"}]},
                                100,
                            ]
                        },
                        None,
                    ]
                },
                "is_completed": {"$eq": ["$completion_status", "completed"]},
                "is_stopped_early": {"$eq": ["$completion_status", "stopped_early"]},
            }
        },
    ]

    rows = await db["viva_sessions"].aggregate(pipeline).to_list(length=None)

    total_vivas = len(rows)
    completed_rows = [r for r in rows if r.get("is_completed")]
    stopped_rows = [r for r in rows if r.get("is_stopped_early")]
    completed_scores = [
        r.get("score_percentage")
        for r in completed_rows
        if isinstance(r.get("score_percentage"), (int, float))
    ]
    completed_with_score = [
        r
        for r in completed_rows
        if isinstance(r.get("score_percentage"), (int, float))
    ]

    average_score = (
        sum(completed_scores) / len(completed_scores) if completed_scores else None
    )
    best_attempt = (
        max(completed_with_score, key=lambda r: r["score_percentage"])
        if completed_with_score
        else None
    )
    last_attempt = (
        max((r.get("completed_at") for r in rows if r.get("completed_at")), default=None)
        if rows
        else None
    )
    total_questions_answered = sum(int(r.get("attempted_questions") or 0) for r in rows)

    unique_docs = {
        (r.get("source_file_name") or "Untitled Document").strip() for r in rows
    }

    completion_rate = (len(completed_rows) / total_vivas * 100) if total_vivas else None
    avg_questions_per_viva = (
        total_questions_answered / total_vivas if total_vivas else None
    )

    topic_totals: Dict[str, Dict[str, float]] = {}
    for row in completed_with_score:
        topic = (row.get("history") or [{}])[0].get("topic", "General")
        if not isinstance(topic, str) or not topic.strip():
            topic = "General"
        if topic not in topic_totals:
            topic_totals[topic] = {"sum": 0.0, "count": 0}
        topic_totals[topic]["sum"] += float(row["score_percentage"])
        topic_totals[topic]["count"] += 1

    strongest_topic = None
    weakest_topic = None
    if topic_totals:
        topic_averages = [
            (topic, data["sum"] / data["count"]) for topic, data in topic_totals.items()
        ]
        strongest_topic = max(topic_averages, key=lambda t: t[1])
        weakest_topic = min(topic_averages, key=lambda t: t[1])

    best_score_context = None
    if best_attempt:
        best_score_context = {
            "score_percentage": round(float(best_attempt["score_percentage"]), 2),
            "attempt_no": int(best_attempt.get("attempt_no") or 0),
            "source_file_name": best_attempt.get("source_file_name"),
            "attempted_questions": int(best_attempt.get("attempted_questions") or 0),
        }

    return {
        "total_vivas": total_vivas,
        "completed_vivas": len(completed_rows),
        "stopped_early_vivas": len(stopped_rows),
        "average_score_percentage": round(float(average_score), 2)
        if average_score is not None
        else None,
        "best_score_percentage": round(float(best_attempt["score_percentage"]), 2)
        if best_attempt
        else None,
        "best_score_context": best_score_context,
        "last_attempt_at": last_attempt,
        "total_questions_answered": total_questions_answered,
        "total_documents_uploaded": len([d for d in unique_docs if d]),
        "completion_rate_percentage": round(float(completion_rate), 2)
        if completion_rate is not None
        else None,
        "avg_questions_per_viva": round(float(avg_questions_per_viva), 2)
        if avg_questions_per_viva is not None
        else None,
        "strongest_topic": {
            "name": strongest_topic[0],
            "score_percentage": round(float(strongest_topic[1]), 2),
        }
        if strongest_topic
        else None,
        "weakest_topic": {
            "name": weakest_topic[0],
            "score_percentage": round(float(weakest_topic[1]), 2),
        }
        if weakest_topic
        else None,
    }


async def migrate_viva_sessions_schema(db) -> None:
    cursor = db["viva_sessions"].find({})
    docs = await cursor.to_list(length=None)
    for doc in docs:
        attempts = [
            _normalize_attempt_record(a, idx + 1) for idx, a in enumerate(doc.get("attempts", []))
        ]

        if not attempts and (
            doc.get("history") is not None
            or doc.get("result") is not None
            or doc.get("setup") is not None
        ):
            fallback_payload = {
                "setup": doc.get("setup")
                or {"difficulty": "Medium", "question_type": "MCQ", "total_questions": 10, "mode": "text"},
                "result": doc.get("result")
                or {
                    "score": 0,
                    "total": 0,
                    "attempted_questions": len(doc.get("history", [])),
                    "average_score": 0.0,
                },
                "history": doc.get("history", []),
                "completion_status": doc.get("completion_status", "completed"),
                "started_at": doc.get("created_at") or datetime.now(timezone.utc),
                "completed_at": doc.get("completed_at") or doc.get("updated_at") or datetime.now(timezone.utc),
            }
            attempts = [_build_attempt_record(1, fallback_payload, fallback_payload["started_at"], fallback_payload["completed_at"])]

        normalized_attempts = [
            _normalize_attempt_record(a, idx + 1) for idx, a in enumerate(attempts)
        ]
        current_attempt_no = int(
            doc.get("current_attempt_no")
            or doc.get("attempt_no")
            or (len(normalized_attempts) if normalized_attempts else 1)
        )
        reattempt_count = max(0, len(normalized_attempts) - 1)

        unset_fields = {
            "history": "",
            "result": "",
            "setup": "",
            "completion_status": "",
            "completed_at": "",
            "attempt_no": "",
        }
        set_fields = {
            "attempts": normalized_attempts,
            "current_attempt_no": current_attempt_no,
            "reattempt_count": reattempt_count,
            "updated_at": doc.get("updated_at") or datetime.now(timezone.utc),
        }
        if "important_chunks" not in doc:
            set_fields["important_chunks"] = []

        await db["viva_sessions"].update_one(
            {"_id": doc["_id"]},
            {"$set": set_fields, "$unset": unset_fields},
        )
