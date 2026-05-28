from typing import List, Optional

from pydantic import BaseModel, Field


class DoubtExchange(BaseModel):
    user: str
    assistant: str


class QuestionLearningAssist(BaseModel):
    doubts: List[DoubtExchange] = Field(default_factory=list)
    deep_explanation: Optional[str] = None


class DoubtTurn(BaseModel):
    user: str
    assistant: str


class DoubtRequest(BaseModel):
    question: str
    user_answer: str
    evaluation_feedback: str
    evaluation_score: int = 0
    exact_reference: Optional[str] = ""
    hidden_context: str = ""
    doubt_message: str
    prior_doubts: List[DoubtTurn] = Field(default_factory=list)


class DoubtResponse(BaseModel):
    answer: str


class ExplainRequest(BaseModel):
    question: str
    user_answer: str
    evaluation_feedback: str
    evaluation_score: int = 0
    exact_reference: Optional[str] = ""
    hidden_context: str = ""


class ExplainResponse(BaseModel):
    title: str
    explanation: str
