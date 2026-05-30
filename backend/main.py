from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from anthropic import Anthropic
import json
import re

app = FastAPI(title="AI Proofreading & Style Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Anthropic()

STYLE_GUIDES = {
    "AP": "Associated Press style: abbreviate months with 6+ letters, use numerals for 10+, no Oxford comma.",
    "Chicago": "Chicago Manual of Style: Oxford comma required, spell out numbers one through one hundred.",
    "APA": "APA style: use past tense for literature, active voice preferred, avoid biased language.",
    "House": "House style: conversational yet professional, short paragraphs, strong verbs, no jargon.",
}

class ProofRequest(BaseModel):
    text: str
    style_guide: str = "AP"
    tone_target: str = "professional"
    focus: list[str] = ["grammar", "clarity", "tone", "readability"]

class SEORequest(BaseModel):
    text: str
    target_audience: str = "general"
    num_keywords: int = 10

class SummaryRequest(BaseModel):
    text: str
    length: str = "short"  # short, medium, long

class RewriteRequest(BaseModel):
    text: str
    goal: str  # e.g. "simplify", "formalize", "energize"

def build_proof_prompt(text: str, style: str, tone: str, focus: list[str]) -> str:
    style_note = STYLE_GUIDES.get(style, STYLE_GUIDES["AP"])
    focus_str = ", ".join(focus)
    return f"""You are a senior editorial assistant. Proofread and analyze the following text.

Style Guide: {style} — {style_note}
Target Tone: {tone}
Focus Areas: {focus_str}

Return ONLY valid JSON with this exact structure:
{{
  "overall_score": <0-100 integer>,
  "summary": "<2-sentence overall assessment>",
  "issues": [
    {{
      "type": "<grammar|clarity|tone|readability|spelling|style>",
      "severity": "<low|medium|high>",
      "original": "<exact problematic text>",
      "suggestion": "<replacement text>",
      "explanation": "<why this is an issue>"
    }}
  ],
  "readability": {{
    "grade_level": "<e.g. Grade 8>",
    "avg_sentence_length": <number>,
    "passive_voice_count": <number>,
    "assessment": "<brief readability note>"
  }},
  "tone_analysis": {{
    "detected_tone": "<detected tone>",
    "alignment": "<how well it matches target tone>",
    "suggestions": ["<suggestion1>", "<suggestion2>"]
  }},
  "strengths": ["<strength1>", "<strength2>"]
}}

TEXT TO ANALYZE:
{text}"""

@app.post("/proofread")
async def proofread(req: ProofRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    if len(req.text) > 10000:
        raise HTTPException(status_code=400, detail="Text exceeds 10,000 character limit")

    prompt = build_proof_prompt(req.text, req.style_guide, req.tone_target, req.focus)
    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )
        raw = response.content[0].text.strip()
        raw = re.sub(r"^```json\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        result = json.loads(raw)
        return result
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/seo-keywords")
async def seo_keywords(req: SEORequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    prompt = f"""Analyze this article and generate SEO keywords. Target audience: {req.target_audience}.

Return ONLY valid JSON:
{{
  "primary_keywords": ["<keyword>"],
  "secondary_keywords": ["<keyword>"],
  "long_tail": ["<phrase>"],
  "meta_description": "<150-160 char meta description>",
  "title_suggestions": ["<title1>", "<title2>", "<title3>"],
  "topics": ["<topic>"]
}}

Provide {req.num_keywords} total keywords spread across primary and secondary.

ARTICLE:
{req.text[:3000]}"""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )
        raw = response.content[0].text.strip()
        raw = re.sub(r"^```json\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        return json.loads(raw)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/summarize")
async def summarize(req: SummaryRequest):
    lengths = {"short": "2-3 sentences", "medium": "1 paragraph", "long": "3 paragraphs"}
    length_desc = lengths.get(req.length, lengths["short"])

    prompt = f"""Summarize the following article in {length_desc}. Be concise and capture the key points.

Return ONLY valid JSON:
{{
  "summary": "<the summary>",
  "key_points": ["<point1>", "<point2>", "<point3>"],
  "word_count_original": <number>,
  "word_count_summary": <number>
}}

ARTICLE:
{req.text[:5000]}"""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=800,
            messages=[{"role": "user", "content": prompt}]
        )
        raw = response.content[0].text.strip()
        raw = re.sub(r"^```json\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        return json.loads(raw)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/rewrite")
async def rewrite(req: RewriteRequest):
    goals = {
        "simplify": "Simplify the language for a general audience, reduce jargon, shorten sentences.",
        "formalize": "Make the tone more formal and professional.",
        "energize": "Make the writing more engaging, dynamic, and vivid. Use strong active verbs.",
        "concise": "Remove unnecessary words and make every sentence punchy and direct.",
    }
    goal_desc = goals.get(req.goal, req.goal)

    prompt = f"""Rewrite the following text. Goal: {goal_desc}

Return ONLY valid JSON:
{{
  "rewritten": "<the rewritten text>",
  "changes_made": ["<change1>", "<change2>"],
  "improvement_notes": "<brief note on what improved>"
}}

ORIGINAL:
{req.text[:3000]}"""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}]
        )
        raw = response.content[0].text.strip()
        raw = re.sub(r"^```json\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        return json.loads(raw)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok"}
