# ProofAI — AI Proofreading & Style Assistant

Full-stack editorial assistant with grammar checking, SEO generation, summarization, and rewriting.

## Stack
- **Backend**: FastAPI + Anthropic Claude API
- **Frontend**: React + Vite

## Project Structure

```
proofreader/
├── backend/
│   ├── main.py            # FastAPI app — all AI endpoints
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        └── App.jsx        # Full UI
```

## Setup

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set your API key
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Run the server
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/proofread` | Grammar, tone, clarity, style analysis |
| POST | `/seo-keywords` | SEO keywords, meta description, title suggestions |
| POST | `/summarize` | Article summarization (short/medium/long) |
| POST | `/rewrite` | Rewrite with a goal (simplify/formalize/energize/concise) |
| GET  | `/health` | Health check |

## Endpoint Payloads

### POST /proofread
```json
{
  "text": "Your article text...",
  "style_guide": "AP",          // AP | Chicago | APA | House
  "tone_target": "professional", // professional | casual | academic | journalistic
  "focus": ["grammar", "clarity", "tone", "readability", "spelling", "style"]
}
```

### POST /seo-keywords
```json
{
  "text": "Your article text...",
  "target_audience": "general",
  "num_keywords": 10
}
```

### POST /summarize
```json
{
  "text": "Your article text...",
  "length": "short"   // short | medium | long
}
```

### POST /rewrite
```json
{
  "text": "Your article text...",
  "goal": "simplify"  // simplify | formalize | energize | concise
}
```

## Known Limitations (from design review)
- No auth layer — add API key middleware before production
- No RAG/style guide corpus — extend with vector DB for org-specific style rules
- LLM hallucination not guarded — add confidence scoring or human review step
- Max 10,000 characters — extend with chunking for long-form documents
- English only — add language detection for multi-language support
