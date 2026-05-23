import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# 🔥 OPENROUTER HATA DIYA! AB DIRECT GROQ USE KARENGE JO STABLE HAI
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Groq ke paas Llama-3.3-70B officially aur reliably available hai
MODEL_NAME = "llama-3.3-70b-versatile"


def generate_single_question(chunk_text: str, settings: dict) -> dict:
    """
    Takes ONE chunk and generates EXACTLY ONE question.
    Forces the LLM to extract the exact text for the explanation.
    """
    try:
        q_type = settings.get("type", "MCQ")
        difficulty = settings.get("difficulty", "Medium")
        domain = settings.get("domain", "General")

        prompt = f"""
        You are a strict examiner. I will provide you with ONE specific text chunk from a document.
        Your task is to generate EXACTLY ONE high-quality {difficulty} level {q_type} question from this text.
        Focus on the domain: {domain}.

        CRITICAL RULES FOR ZERO HALLUCINATION:
        1. The question MUST be fully answerable using ONLY the provided text chunk.
        2. For the "explanation" field, you MUST extract and copy-paste the EXACT SENTENCE(S) from the text chunk that contains the answer. DO NOT rephrase it. DO NOT add your own words.

        JSON FORMAT (STRICT):
        {{
            "question": "...",
            "options": ["A. ...", "B. ...", "C. ...", "D. ..."], // Include only if MCQ
            "correct_answer": "...",
            "explanation": "EXACT COPY-PASTED TEXT FROM THE CHUNK GOES HERE."
        }}

        --- TEXT CHUNK ---
        {chunk_text}
        --- END OF TEXT CHUNK ---
        """

        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": "You output strict JSON objects only. No markdown formatting."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1, # Temperature bohot low rakhi hai taaki hallucination bilkul na ho
            response_format={"type": "json_object"}
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