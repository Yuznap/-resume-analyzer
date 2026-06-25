"""
main.py  –  FastAPI backend for AI Resume Analyzer
Endpoints:
  POST /analyze   multipart/form-data  { file: PDF }
  GET  /health
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pickle, json, io, re, os
import numpy as np

# PDF extraction – try pdfplumber first, fallback to PyPDF2
try:
    import pdfplumber
    PDF_BACKEND = "pdfplumber"
except ImportError:
    import PyPDF2
    PDF_BACKEND = "PyPDF2"

app = FastAPI(title="AI Resume Analyzer", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Load ML artefacts once at startup ───────────────────────────────────────

BASE = os.path.dirname(__file__)

with open(os.path.join(BASE, "model.pkl"), "rb") as f:
    MODEL = pickle.load(f)

with open(os.path.join(BASE, "features.json")) as f:
    FEATURES = json.load(f)          # list of all skill strings

with open(os.path.join(BASE, "career_skills.json")) as f:
    CAREER_SKILLS = json.load(f)     # career → [required skills]


# ─── Helpers ─────────────────────────────────────────────────────────────────

def extract_text_from_pdf(file_bytes: bytes) -> str:
    if PDF_BACKEND == "pdfplumber":
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            return "\n".join(
                page.extract_text() or "" for page in pdf.pages
            )
    else:
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        return "\n".join(
            page.extract_text() or "" for page in reader.pages
        )


def extract_skills(text: str) -> list[str]:
    text_lower = text.lower()
    found = []
    for skill in FEATURES:
        # whole-word / whole-phrase match
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            found.append(skill)
    return found


def build_feature_vector(skills: list[str]) -> np.ndarray:
    return np.array([[1 if s in skills else 0 for s in FEATURES]])


def skill_gap(career: str, current_skills: list[str]) -> list[str]:
    required = CAREER_SKILLS.get(career, [])
    return [s for s in required if s not in current_skills]


def confidence_scores(feature_vec: np.ndarray) -> dict:
    """Return top-3 career probabilities (Random Forest / LR support predict_proba)."""
    try:
        probs = MODEL.predict_proba(feature_vec)[0]
        classes = MODEL.classes_
        top3 = sorted(zip(classes, probs), key=lambda x: -x[1])[:3]
        return [{"career": c, "probability": round(float(p) * 100, 1)} for c, p in top3]
    except Exception:
        return []


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "pdf_backend": PDF_BACKEND}


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")

    raw = await file.read()
    if len(raw) > 5 * 1024 * 1024:          # 5 MB limit
        raise HTTPException(status_code=400, detail="File too large (max 5 MB).")

    # 1. Extract text
    try:
        text = extract_text_from_pdf(raw)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not read PDF: {e}")

    if not text.strip():
        raise HTTPException(status_code=422, detail="PDF appears to be empty or scanned (no extractable text).")

    # 2. Skill extraction
    detected_skills = extract_skills(text)

    if not detected_skills:
        raise HTTPException(
            status_code=422,
            detail="No recognisable skills found. Make sure your resume lists skills explicitly."
        )

    # 3. ML prediction
    fv = build_feature_vector(detected_skills)
    predicted_career = MODEL.predict(fv)[0]
    top_careers = confidence_scores(fv)

    # 4. Skill gap
    missing_skills = skill_gap(predicted_career, detected_skills)
    required_skills = CAREER_SKILLS.get(predicted_career, [])

    return {
        "detected_skills":   detected_skills,
        "recommended_career": predicted_career,
        "top_careers":        top_careers,
        "required_skills":    required_skills,
        "missing_skills":     missing_skills,
        "match_percentage":   round(
            len([s for s in required_skills if s in detected_skills]) /
            max(len(required_skills), 1) * 100, 1
        ),
    }
