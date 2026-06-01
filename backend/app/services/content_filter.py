import re

def extract_useful_content(chunks):
    """
    Yeh function saare chunks ko check karega aur sirf 'Pure Academic Content' ko aage jane dega.
    """
    good_chunks = []
    
    # Marketing aur junk words ki list
    junk_keywords = [
        "subscribe", "click here", "features include", "pricing", 
        "table of contents", "index", "all rights reserved", 
        "visit our website", "read more", "copyright", "participants"
    ]

    for chunk in chunks:
        text = chunk.page_content
        lines = text.split('\n')
        
        # Rule 1: Too Short (Agar paragraph me 250 characters se kam hain, toh viva lene layak info nahi hogi)
        if len(text.strip()) < 250:
            continue
            
        # Rule 2: Markdown Table Filter (Tune jo | Looka | wala error face kiya tha)
        # Agar text ki 40% se zyada lines '|' (table) ya '-' (list) se shuru hoti hain bina thik description ke, toh skip karo.
        table_lines = sum(1 for line in lines if line.strip().startswith('|') or line.strip().startswith('-'))
        if len(lines) > 0 and (table_lines / len(lines)) > 0.4:
            continue
            
        # Rule 3: Promotional/Junk Keyword Check
        if any(junk in text.lower() for junk in junk_keywords):
            continue
            
        # Rule 4: "Real Sentence" Check (Grammar Check)
        # Asli theory aur concepts mein connecting words hote hain. Agar ye nahi hain, toh wo bas ek ajeeb sa index ya data hai.
        if not re.search(r'\b(is|are|the|of|and|in|to|which|that)\b', text.lower()):
            continue
            
        # Agar chunk saare strict test pass kar leta hai, toh wo "Badhiya Content" hai!
        good_chunks.append(chunk)
        
    return good_chunks