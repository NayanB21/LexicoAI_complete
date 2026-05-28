from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class CommunicationAnalysis(BaseModel):
    clarity: str = ""
    confidence: str = ""
    explanation_quality: str = ""
    conceptual_depth: str = ""
    consistency: str = ""
    summary: str = ""


class PerformanceTrends(BaseModel):
    trend_direction: str = "insufficient_data"
    summary: str = ""
    difficult_question_handling: str = ""
    mistake_patterns: List[str] = Field(default_factory=list)
    score_by_question: List[int] = Field(default_factory=list)


class VivaPerformanceAnalysis(BaseModel):
    overall_performance: str
    overall_rating: str = "Developing"
    strong_topics: List[str] = Field(default_factory=list)
    weak_topics: List[str] = Field(default_factory=list)
    communication_analysis: CommunicationAnalysis
    performance_trends: PerformanceTrends
    improvement_suggestions: List[str] = Field(default_factory=list)
    examiner_notes: Optional[str] = None


class VivaPerformanceAnalysisStored(VivaPerformanceAnalysis):
    generated_at: datetime
