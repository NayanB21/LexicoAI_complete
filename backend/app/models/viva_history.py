from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel

from app.models.viva_learning import QuestionLearningAssist


class VivaEvaluation(BaseModel):
    score: int
    feedback: str
    exact_reference: Optional[str] = ""


class VivaHistoryItem(BaseModel):
    q: str
    a: str
    e: VivaEvaluation
    topic: Optional[str] = None
    hidden_context: Optional[str] = None
    learning: Optional[QuestionLearningAssist] = None


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
    started_at: datetime
    completion_status: str
    completed_at: datetime
    setup: VivaSessionSetup
    result: VivaSessionResult
    history: List[VivaHistoryItem]


class VivaSessionCreateRequest(BaseModel):
    title: str
    source_file_name: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    setup: VivaSessionSetup
    result: VivaSessionResult
    history: List[VivaHistoryItem]
    completion_status: str = "completed"
    attempt_no: Optional[int] = None


class VivaSessionReattemptRequest(BaseModel):
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    setup: Optional[VivaSessionSetup] = None
    result: VivaSessionResult
    history: List[VivaHistoryItem]
    completion_status: str = "completed"


class VivaSessionListItem(BaseModel):
    id: str
    session_id: Optional[str] = None
    title: str
    created_at: datetime
    started_at: datetime
    completed_at: datetime
    score: int = 0
    total: int = 0
    attempted_questions: int = 0
    difficulty: str = "Medium"
    question_type: str = "MCQ"
    total_questions: int = 10
    completion_status: str = "completed"
    attempt_no: int = 1
    source_file_name: Optional[str] = None
    reattempt_count: int = 0
    has_analysis: bool = False


class VivaSessionDetail(BaseModel):
    id: str
    title: str
    source_file_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    current_attempt_no: int = 1
    reattempt_count: int = 0
    attempts: List[VivaAttemptRecord] = []
    current_attempt: Optional[VivaAttemptRecord] = None
    performance_analysis: Optional[Any] = None
    has_analysis: bool = False
