from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def compress_context(chunks):

    # Combine retrieved chunks
    combined_text = "\n\n".join(

    [
        f"""
SECTION METADATA:
{doc.metadata}

CONTENT:
{doc.page_content}
"""
        for doc in chunks
    ]
)

    print("🧠 Compressing retrieved context...")

    prompt = f"""
You are an expert academic concept extractor.

Your task is to create HIGH-DENSITY conceptual notes
from the provided educational content.

IMPORTANT RULES:

1. KEEP:
- Prioritize theoretical concepts over product/tool listings
- definitions
- key concepts
- relationships
- architectures
- workflows
- important terminology
- advantages/disadvantages
- cause-effect relations

2. REMOVE:
- repeated information
- filler text
- examples unless critical
- formatting noise
- tables
- unnecessary details

3. OUTPUT STYLE:
- concise
- concept-rich
- logically connected
- educational
- information dense

4. DO NOT:
- explain like a teacher
- add extra knowledge
- hallucinate
- summarize too vaguely

Your goal:
MAXIMUM INFORMATION
MINIMUM TOKENS

CONTENT:
{combined_text}
"""

    response = client.chat.completions.create(

        model="llama-3.1-8b-instant",

        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],

        temperature=0.2

    )

    compressed_context = response.choices[0].message.content

    print("✅ Context compressed successfully!")

    return compressed_context