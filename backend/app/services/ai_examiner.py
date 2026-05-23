import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# 🔥 OPENROUTER HATA DIYA! AB DIRECT GROQ USE KARENGE JO STABLE HAI
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Groq ke paas Llama-3.3-70B officially aur reliably available hai
MODEL_NAME = "llama-3.3-70b-versatile"


def generate_viva_questions(
    context_chunks: list[str],
    settings: dict
) -> str:

    try:

        print("🤖 AI Examiner is generating conceptual viva questions...")

        # Combine compressed context
        context = "\n\n".join(context_chunks)

        # Settings
        num_questions = settings.get("questions", "3")

        q_type = settings.get("type", "MCQ")

        difficulty = settings.get("difficulty", "Medium")

        domain = settings.get("domain", "General")

        # Better Prompt Engineering
        prompt = f"""
You are an expert university viva examiner.

Your task is to generate HIGH-QUALITY,
CONCEPTUAL, and MEANINGFUL viva questions
ONLY from the provided context.

========================
QUESTION REQUIREMENTS
========================

Generate exactly {num_questions} {q_type} questions.

Difficulty Level:
{difficulty}

Domain:
{domain}

========================
IMPORTANT RULES
========================

1. Questions MUST:
- test conceptual understanding
- test reasoning ability
- test relationships between ideas
- focus on important concepts
- sound like real viva/interview questions
- require actual understanding

2. PRIORITIZE:
- definitions
- architectures
- workflows
- technical concepts
- advantages/disadvantages
- comparisons
- applications
- challenges
- reasoning-based understanding

3. STRICTLY AVOID:
- trivial questions
- superficial MCQs
- repeated questions
- table-column questions
- metadata questions
- formatting-based questions
- useless factual recall

4. USE ONLY PROVIDED CONTEXT.
Do NOT add external knowledge.

5. RETURN ONLY VALID JSON.
No markdown.
No explanation outside JSON.

========================
JSON FORMAT
========================

[
  {{
    "question": "...",
    "options": [
      "A. ...",
      "B. ...",
      "C. ...",
      "D. ..."
    ],
    "correct_answer": "A",
    "explanation": "..."
  }}
]

========================
CONTEXT
========================

{context}
"""



        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": "You are a strict academic viva examiner. Output MUST be valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            response_format={"type": "json_object"} # Groq strict JSON support
        )


        result = response.choices[0].message.content

        result = result.strip()

        # Remove markdown wrappers
        if result.startswith("```json"):
            result = result.replace("```json", "")

        if result.endswith("```"):
            result = result.replace("```", "")

        result = result.strip()

        print(f"🤖 Final Working Model: {MODEL_NAME}")
        

        print("✅ Viva questions generated successfully!")

        return result

    except Exception as e:

        print(f"❌ AI Generation failed: {e}")

        return json.dumps([
            {
                "question": "Error generating questions.",
                "error": str(e)
            }
        ])