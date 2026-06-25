# AI Resume Analyzer — Career Recommendation & Skill Gap Detection

A college project that uses **Machine Learning (scikit-learn)** + **FastAPI** + **React** to:
1. Parse a PDF resume
2. Detect skills automatically
3. Predict the best-fit career (ML classification)
4. Show which skills are missing

---

## Project Structure

```
resume-analyzer/
├── backend/
│   ├── train_model.py     # generates dataset + trains & saves ML model
│   ├── main.py            # FastAPI server (3 endpoints)
│   ├── requirements.txt
│   ├── model.pkl          # saved after running train_model.py
│   ├── features.json      # skill feature list
│   └── career_skills.json # career → required skills mapping
└── frontend/
    ├── src/
    │   ├── App.jsx        # main React component
    │   ├── App.css        # all styles
    │   └── index.jsx      # entry point
    ├── public/index.html
    ├── package.json
    └── vite.config.js
```

---

## Quick Start (run in two terminals)

### Terminal 1 – Backend

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Train the ML model (only needed once)
python train_model.py

# Start the API server
uvicorn main:app --reload --port 8000
```

The API will be live at http://localhost:8000
Swagger docs: http://localhost:8000/docs

### Terminal 2 – Frontend

```bash
cd frontend
npm install
npm start
```

Open http://localhost:3000 in your browser.

---

## ML Details (explain in viva)

| Concept       | What we use                                      |
|---------------|--------------------------------------------------|
| Features      | Binary vector: 1 if skill present, 0 if absent   |
| Labels        | Career names (Web Developer, AI/ML Engineer …)   |
| Algorithm     | Logistic Regression / Decision Tree / Random Forest |
| Best model    | Auto-selected by highest test accuracy           |
| Train/Test    | 80/20 split with stratification                  |
| Dataset       | 2,400 synthetic resumes (300 × 8 careers)        |

### Why three algorithms?
We train all three and pick the best. This demonstrates model comparison — a real ML workflow.

### How career prediction works
1. Text is extracted from the PDF.
2. A binary feature vector is built (1 = skill present).
3. The trained classifier predicts a career label.
4. `predict_proba()` gives confidence % for top-3 careers.

### Skill Gap formula
```
missing = required_skills_for_career - detected_skills_in_resume
```

---

## Supported Careers & Required Skills

| Career                | Key Skills Required                              |
|-----------------------|--------------------------------------------------|
| Web Developer         | HTML, CSS, JavaScript, Bootstrap, Git            |
| Full Stack Developer  | HTML, CSS, React, Node.js, MongoDB, SQL          |
| AI/ML Engineer        | Python, ML, TensorFlow, Pandas, NumPy            |
| Data Analyst          | Python, SQL, Pandas, Tableau, Statistics         |
| Backend Developer     | Python/Java, Node.js, SQL, Docker, REST API      |
| Android Developer     | Java, Kotlin, Firebase, Jetpack Compose          |
| Cloud Engineer        | AWS/Azure, Docker, Kubernetes, Terraform         |
| DevOps Engineer       | Docker, Kubernetes, CI/CD, Linux, Ansible        |

---

## API Endpoints

```
GET  /health     → {"status": "ok"}
POST /analyze    → upload PDF → returns JSON result
```

Response shape:
```json
{
  "detected_skills":    ["html", "css", "react"],
  "recommended_career": "Full Stack Developer",
  "top_careers":        [{"career": "...", "probability": 87.3}, ...],
  "required_skills":    ["html", "css", "react", "node.js", ...],
  "missing_skills":     ["node.js", "express.js", "mongodb"],
  "match_percentage":   45.5
}
```

---

## Common Viva Questions

**Q: Is this real AI/ML?**
A: Yes. We use scikit-learn's classifiers (Logistic Regression, Decision Tree, Random Forest). The model is trained on a labelled dataset, learns patterns between skill sets and careers, and makes predictions on unseen resumes.

**Q: Why synthetic data?**
A: Real labelled resume datasets are hard to get due to privacy. Synthetic data lets us control quality. In production this would be replaced with real data.

**Q: Which algorithm performed best?**
A: Run `python train_model.py` to see live comparison. Usually Logistic Regression or Random Forest wins.

**Q: What's the feature vector?**
A: A list of 50+ skills. For each skill, we put 1 if the resume contains it, 0 if not. The ML model learns which combination of 1s/0s maps to which career.

**Q: How is skill gap calculated?**
A: It's pure set subtraction — `required_skills - detected_skills`. No ML needed here; business logic is enough.
