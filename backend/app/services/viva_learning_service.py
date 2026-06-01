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
    prompt = f"""
        You are an empathetic, expert university mentor helping a student deeply understand their recent Viva exam performance. 
        The student has a follow-up doubt regarding a question they just answered.

        YOUR CRITICAL RULES & PEDAGOGY:
        1. BRIDGE THE KNOWLEDGE GAP: Don't just give the answer. Analyze the STUDENT ANSWER and EXAMINER FEEDBACK. Gently explain exactly *where* their thought process went wrong or what they missed.
        2. STRICT ALIGNMENT: You are explaining the examiner's decision. DO NOT contradict the examiner, DO NOT change the score, and DO NOT evaluate the answer again.
        3. NO HALLUCINATION: Base your explanation STRICTLY on the GROUND TRUTH REFERENCE and DOCUMENT CONTEXT. If the student asks something completely unrelated to the context, politely steer them back to the topic.
        4. TONE: Be incredibly supportive, encouraging, and clear. Use analogies if helpful. Make the student feel like they are learning, not being judged.

        INPUT DATA:
        - VIVA QUESTION: {_clip(question, MAX_QUESTION)}
        - STUDENT'S ORIGINAL ANSWER: {_clip(user_answer, MAX_ANSWER)}
        - EVALUATION SCORE: {evaluation_score}
        - EXAMINER FEEDBACK: {_clip(evaluation_feedback, MAX_FEEDBACK)}
        - GROUND TRUTH REFERENCE: {_clip(exact_reference or "No exact reference provided.", MAX_CONTEXT)}
        - FULL DOCUMENT CONTEXT: {_clip(hidden_context, MAX_CONTEXT)}
        
        - PRIOR CHAT HISTORY: {_format_prior_doubts(prior_doubts)}
        
        STUDENT'S NEW DOUBT: 
        "{_clip(doubt_message, 500)}"

        Output STRICTLY as a valid JSON object ONLY. Do NOT wrap in markdown blocks like ```json.
        {{
            "answer": "Your warm, insightful explanation here. Use markdown for readability (bolding key terms, bullet points if needed). Keep it highly engaging and under 300 words."
        }}
        """
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
    prompt = f"""
        You are an elite, highly empathetic university professor delivering a 1-on-1 masterclass to a student who struggled with a specific Viva concept.
        Your goal is to break down the underlying academic concept so beautifully and clearly that the student never forgets it.

        YOUR CRITICAL RULES & PEDAGOGY (THE FEYNMAN TECHNIQUE):
        1. DECONSTRUCT THE CONCEPT: Don't just repeat the answer. Break the core concept down into simple, digestible pieces based ONLY on the provided DOCUMENT CONTEXT.
        2. USE A REAL-WORLD ANALOGY: You MUST include at least one brilliant, easy-to-understand real-world analogy to make the abstract concept click for a beginner.
        3. CONNECT THE DOTS: Briefly explain how this deep concept applies to the specific question they just missed, correcting their specific misconception.
        4. IMMUTABLE EVALUATION: Do NOT re-score the answer, and do NOT contradict the original examiner's feedback.

        INPUT DATA:
        - VIVA QUESTION: {_clip(question, MAX_QUESTION)}
        - STUDENT'S ORIGINAL ANSWER: {_clip(user_answer, MAX_ANSWER)}
        - EVALUATION SCORE: {evaluation_score}
        - EXAMINER FEEDBACK: {_clip(evaluation_feedback, MAX_FEEDBACK)}
        - GROUND TRUTH REFERENCE: {_clip(exact_reference or "No reference provided.", MAX_CONTEXT)}
        - FULL DOCUMENT CONTEXT: {_clip(hidden_context, MAX_CONTEXT)}

        Output STRICTLY as a valid JSON object ONLY. Do NOT wrap in markdown blocks like ```json.
        {{
            "title": "An engaging, specific title for this mini-lesson (5-10 words)",
            "explanation": "Your masterclass explanation here. Use beautiful markdown formatting (e.g., ### The Core Concept, ### Analogy, bullet points, bold text). Keep it engaging, highly educational, and between 250-500 words."
        }}
        """

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
