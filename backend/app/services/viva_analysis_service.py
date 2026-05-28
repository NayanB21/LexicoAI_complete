import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from groq import Groq
from pydantic import ValidationError

from app.models.viva_analysis import VivaPerformanceAnalysis
from app.services.ai_examiner import MODEL_NAME

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

MAX_QUESTION_CHARS = 900
MAX_ANSWER_CHARS = 900
MAX_FEEDBACK_CHARS = 700


def _clip(text: Optional[str], limit: int) -> str:
    if not text:
        return ""
    text = str(text).strip()
    if len(text) <= limit:
        return text
    return text[: limit - 3] + "..."


def _build_qa_payload(history: List[Dict[str, Any]]) -> str:
    blocks = []
    for i, item in enumerate(history, 1):
        evaluation = item.get("e") or {}
        if isinstance(evaluation, dict):
            score = evaluation.get("score", "N/A")
            feedback = _clip(evaluation.get("feedback"), MAX_FEEDBACK_CHARS)
        else:
            score = getattr(evaluation, "score", "N/A")
            feedback = _clip(getattr(evaluation, "feedback", ""), MAX_FEEDBACK_CHARS)

        blocks.append(
            f"""--- Question {i} ---
Question: {_clip(item.get("q"), MAX_QUESTION_CHARS)}
User answer: {_clip(item.get("a"), MAX_ANSWER_CHARS)}
Score: {score}
Evaluator feedback: {feedback or "(none)"}"""
        )
    return "\n\n".join(blocks) if blocks else "(No answered questions recorded)"


def _build_analysis_prompt(session_doc: Dict[str, Any]) -> str:
    setup = session_doc.get("setup") or {}
    result = session_doc.get("result") or {}
    history = session_doc.get("history") or []
    status = session_doc.get("completion_status", "completed")
    attempted = result.get("attempted_questions") or len(history)
    planned = setup.get("total_questions") or result.get("total") or attempted
    avg = result.get("average_score", 0)

    early_stop = status == "stopped_early"
    low_count = len(history) < 3

    constraints = []
    if early_stop:
        constraints.append("The viva was stopped early; analyze only attempted questions and note limited coverage.")
    if low_count:
        constraints.append(
            f"Only {len(history)} question(s) were attempted; keep conclusions cautious and mention limited sample size in examiner_notes."
        )
    if not history:
        constraints.append("No Q&A pairs exist; return minimal placeholder analysis explaining insufficient data.")

    constraint_text = "\n".join(f"- {c}" for c in constraints) if constraints else "- None"

    qa_text = _build_qa_payload(history)

    return f"""You are an expert viva examiner and academic performance coach.
Analyze the student's viva performance using ONLY the session data below.
Infer conceptual topics from questions, answers, and evaluator feedback.
Do NOT invent questions or scores not present in the data.

SESSION METADATA
- Difficulty: {setup.get("difficulty", "Unknown")}
- Question type: {setup.get("question_type", "Unknown")}
- Planned questions: {planned}
- Attempted: {attempted}
- Completion status: {status}
- Total score (sum of per-question scores): {result.get("score", 0)}
- Average score per question: {avg:.2f}

SPECIAL CONSTRAINTS
{constraint_text}

QUESTION-BY-QUESTION RECORD
{qa_text}

Return ONLY valid JSON (no markdown fences) with this exact structure:
{{
  "overall_performance": "2-4 sentence professional narrative summarizing viva performance",
  "overall_rating": "one of: Outstanding, Strong, Satisfactory, Developing, Needs Improvement",
  "strong_topics": ["concept or topic where student performed well"],
  "weak_topics": ["concept or topic needing improvement"],
  "communication_analysis": {{
    "clarity": "brief assessment",
    "confidence": "brief assessment",
    "explanation_quality": "brief assessment",
    "conceptual_depth": "brief assessment",
    "consistency": "brief assessment across answers",
    "summary": "1-2 sentence synthesis"
  }},
  "performance_trends": {{
    "trend_direction": "improved | declined | mixed | stable | insufficient_data",
    "summary": "how performance changed across the viva",
    "difficult_question_handling": "how student handled harder or low-scoring items",
    "mistake_patterns": ["recurring mistake or gap pattern"],
    "score_by_question": [list of integer scores in order for each question above]
  }},
  "improvement_suggestions": ["specific actionable suggestion"],
  "examiner_notes": "optional notes on data limitations or early stop"
}}

Rules:
- strong_topics and weak_topics must be specific concepts, not generic praise.
- improvement_suggestions: 3-6 personalized items.
- score_by_question length must match number of questions listed.
- Be honest, constructive, and interview-style professional."""


def _parse_llm_json(raw: str) -> Dict[str, Any]:
    text = raw.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [line for line in lines if not line.strip().startswith("```")]
        text = "\n".join(lines).strip()
    return json.loads(text)


async def generate_performance_analysis(session_doc: Dict[str, Any]) -> Dict[str, Any]:
    history = session_doc.get("history") or []
    if not history:
        fallback = VivaPerformanceAnalysis(
            overall_performance="Insufficient data to produce a meaningful performance analysis. No answered questions were recorded for this session.",
            overall_rating="Needs Improvement",
            strong_topics=[],
            weak_topics=[],
            communication_analysis={
                "clarity": "Not assessable",
                "confidence": "Not assessable",
                "explanation_quality": "Not assessable",
                "conceptual_depth": "Not assessable",
                "consistency": "Not assessable",
                "summary": "No answers available for analysis.",
            },
            performance_trends={
                "trend_direction": "insufficient_data",
                "summary": "No question sequence to analyze.",
                "difficult_question_handling": "Not assessable",
                "mistake_patterns": [],
                "score_by_question": [],
            },
            improvement_suggestions=[
                "Complete at least one viva question before requesting analysis.",
                "Review your source material and retry the viva.",
            ],
            examiner_notes="Analysis skipped: empty history.",
        )
        return fallback.model_dump()

    prompt = _build_analysis_prompt(session_doc)

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content
    parsed = _parse_llm_json(raw)

    # Align score_by_question with actual history if model mismatch
    trends = parsed.get("performance_trends") or {}
    scores = trends.get("score_by_question") or []
    if len(scores) != len(history):
        rebuilt = []
        for item in history:
            e = item.get("e") or {}
            rebuilt.append(int(e.get("score", 0)) if isinstance(e, dict) else 0)
        trends["score_by_question"] = rebuilt
        parsed["performance_trends"] = trends

    try:
        validated = VivaPerformanceAnalysis.model_validate(parsed)
    except ValidationError as exc:
        raise ValueError(f"Invalid analysis structure from model: {exc}") from exc

    return validated.model_dump()
