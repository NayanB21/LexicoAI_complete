import json
import os
from typing import List

from groq import Groq

from app.services.ai_examiner import MODEL_NAME

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

MAX_CONTEXT = 2200
MAX_FEEDBACK = 800
MAX_ANSWER = 800
MAX_QUESTION = 900
MAX_PRIOR_TURNS = 6


def _clip(text: str, limit: int) -> str:
    if not text:
        return ""
    text = str(text).strip()
    return text if len(text) <= limit else text[: limit - 3] + "..."


def _format_prior_doubts(turns: List[dict]) -> str:
    if not turns:
        return "(No prior doubts in this thread)"
    lines = []
    for i, turn in enumerate(turns[-MAX_PRIOR_TURNS:], 1):
        lines.append(f"Doubt {i} — Student: {_clip(turn.get('user', ''), 400)}")
        lines.append(f"Doubt {i} — Tutor: {_clip(turn.get('assistant', ''), 600)}")
    return "\n".join(lines)


async def answer_doubt(
    question: str,
    user_answer: str,
    evaluation_feedback: str,
    evaluation_score: int,
    exact_reference: str,
    hidden_context: str,
    doubt_message: str,
    prior_doubts: List[dict],
) -> str:
    prompt = f"""You are a supportive AI viva tutor. The student just completed one viva question and has a follow-up doubt.
Answer ONLY using the viva context below. Be clear, encouraging, and educational.
Do NOT change their score or re-evaluate the answer. Do NOT invent facts outside the document context.

VIVA QUESTION:
{_clip(question, MAX_QUESTION)}

STUDENT ANSWER:
{_clip(user_answer, MAX_ANSWER)}

EVALUATION SCORE: {evaluation_score}
EVALUATOR FEEDBACK:
{_clip(evaluation_feedback, MAX_FEEDBACK)}

SOURCE REFERENCE FROM DOCUMENT:
{_clip(exact_reference or "", MAX_CONTEXT)}

DOCUMENT CONTEXT:
{_clip(hidden_context, MAX_CONTEXT)}

PRIOR DOUBT THREAD (same question):
{_format_prior_doubts(prior_doubts)}

NEW STUDENT DOUBT:
{_clip(doubt_message, 500)}

Respond in JSON only:
{{ "answer": "your helpful tutor response (markdown allowed, keep under 400 words)" }}"""

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        response_format={"type": "json_object"},
    )
    raw = json.loads(response.choices[0].message.content)
    return str(raw.get("answer", "")).strip() or "I could not generate a response. Please try rephrasing your doubt."


async def generate_deep_explanation(
    question: str,
    user_answer: str,
    evaluation_feedback: str,
    evaluation_score: int,
    exact_reference: str,
    hidden_context: str,
) -> dict:
    prompt = f"""You are an expert AI tutor delivering a deeper lesson after a viva question.
The student needs a beginner-friendly but thorough explanation of the underlying concept(s).

Use the viva context below. Include examples or analogies where helpful.
Structure with short paragraphs or bullet points. Do NOT re-score the answer.

VIVA QUESTION:
{_clip(question, MAX_QUESTION)}

STUDENT ANSWER:
{_clip(user_answer, MAX_ANSWER)}

EVALUATION SCORE: {evaluation_score}
EVALUATOR FEEDBACK:
{_clip(evaluation_feedback, MAX_FEEDBACK)}

SOURCE REFERENCE:
{_clip(exact_reference or "", MAX_CONTEXT)}

DOCUMENT CONTEXT:
{_clip(hidden_context, MAX_CONTEXT)}

Return JSON only:
{{
  "title": "short title for the concept (5-10 words)",
  "explanation": "detailed educational explanation (markdown allowed, 250-500 words, step-by-step where useful)"
}}"""

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.35,
        response_format={"type": "json_object"},
    )
    raw = json.loads(response.choices[0].message.content)
    return {
        "title": str(raw.get("title", "Concept deep dive")).strip(),
        "explanation": str(raw.get("explanation", "")).strip()
        or "Unable to generate explanation. Please try again.",
    }
