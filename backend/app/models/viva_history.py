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


class VivaSessionCreateRequest(BaseModel):
    title: str
    source_file_name: Optional[str] = None
    setup: VivaSessionSetup
    result: VivaSessionResult
    history: List[VivaHistoryItem]


class VivaSessionListItem(BaseModel):
    id: str
    title: str
    created_at: datetime
    completed_at: datetime
    score: int
    total: int
    difficulty: str
    question_type: str
    total_questions: int


class VivaSessionDetail(BaseModel):
    id: str
    title: str
    source_file_name: Optional[str] = None
    created_at: datetime
    completed_at: datetime
    setup: VivaSessionSetup
    result: VivaSessionResult
    history: List[VivaHistoryItem]
