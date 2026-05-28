from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class VivaEvaluation(BaseModel):
    score: int
    feedback: str
    exact_reference: Optional[str] = ""


class VivaHistoryItem(BaseModel):
    q: str
    a: str
    e: VivaEvaluation
    hidden_context: Optional[str] = None


class VivaSessionSetup(BaseModel):
    difficulty: str
    question_type: str
    total_questions: int
    mode: str = "text"


class VivaSessionResult(BaseModel):
    score: int
    total: int
    attempted_questions: int = 0
    average_score: float = 0.0


class VivaAttemptRecord(BaseModel):
    attempt_no: int
    completion_status: str
    score: int
    total: int
    attempted_questions: int
    average_score: float = 0.0
    completed_at: datetime
    history: List[VivaHistoryItem]


class VivaSessionCreateRequest(BaseModel):
    title: str
    source_file_name: Optional[str] = None
    setup: VivaSessionSetup
    result: VivaSessionResult
    history: List[VivaHistoryItem]
    completion_status: str = "completed"
    attempt_no: Optional[int] = None


class VivaSessionReattemptRequest(BaseModel):
    result: VivaSessionResult
    history: List[VivaHistoryItem]
    completion_status: str = "completed"


class VivaSessionListItem(BaseModel):
    id: str
    title: str
    created_at: datetime
    completed_at: datetime
    score: int
    total: int
    attempted_questions: int = 0
    difficulty: str
    question_type: str
    total_questions: int
    completion_status: str = "completed"
    attempt_no: int = 1
    source_file_name: Optional[str] = None
    reattempt_count: int = 0


class VivaSessionDetail(BaseModel):
    id: str
    title: str
    source_file_name: Optional[str] = None
    created_at: datetime
    completed_at: datetime
    setup: VivaSessionSetup
    result: VivaSessionResult
    history: List[VivaHistoryItem]
    completion_status: str = "completed"
    attempt_no: int = 1
    reattempt_count: int = 0
    attempts: List[VivaAttemptRecord] = []
