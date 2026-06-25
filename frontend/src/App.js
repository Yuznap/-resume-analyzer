import React, { useState, useCallback } from "react";
import axios from "axios";
import "./App.css";

// ─── Small reusable components ────────────────────────────────────────────────

function SkillBadge({ label, variant = "default" }) {
  return <span className={`badge badge--${variant}`}>{label}</span>;
}

function ProgressBar({ pct, color }) {
  return (
    <div className="progress-track">
      <div
        className="progress-fill"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

function AlternativeCard({ career, score }) {
  return (
    <div className="alt-card">
      <span className="alt-career">{career}</span>
      <span className="alt-score">{score}%</span>
    </div>
  );
}

// ─── Upload area ──────────────────────────────────────────────────────────────

function UploadArea({ onFileSelect, onTextChange, mode, setMode, file, resumeText }) {
  const [drag, setDrag] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDrag(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === "application/pdf") onFileSelect(dropped);
  }, [onFileSelect]);

  return (
    <div className="upload-area">
      <div className="mode-toggle">
        <button
          className={`toggle-btn ${mode === "pdf" ? "active" : ""}`}
          onClick={() => setMode("pdf")}
        >
          📄 Upload PDF
        </button>
        <button
          className={`toggle-btn ${mode === "text" ? "active" : ""}`}
          onClick={() => setMode("text")}
        >
          📝 Paste Text
        </button>
      </div>

      {mode === "pdf" ? (
        <div
          className={`drop-zone ${drag ? "drag-over" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-input").click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".pdf"
            style={{ display: "none" }}
            onChange={(e) => onFileSelect(e.target.files[0])}
          />
          {file ? (
            <>
              <div className="file-icon">✅</div>
              <p className="drop-label">{file.name}</p>
              <p className="drop-sub">Click to replace</p>
            </>
          ) : (
            <>
              <div className="file-icon">📂</div>
              <p className="drop-label">Drop your PDF resume here</p>
              <p className="drop-sub">or click to browse</p>
            </>
          )}
        </div>
      ) : (
        <textarea
          className="text-input"
          placeholder="Paste your resume text here…&#10;&#10;Include skills, experience, education, projects."
          value={resumeText}
          onChange={(e) => onTextChange(e.target.value)}
          rows={10}
        />
      )}
    </div>
  );
}

// ─── Results panel ────────────────────────────────────────────────────────────

function Results({ data }) {
  const {
    detected_skills, career, confidence,
    alternatives, matched_skills, missing_skills,
    required_skills, match_percentage,
  } = data;

  const matchColor =
    match_percentage >= 70 ? "#22c55e" :
    match_percentage >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="results">

      {/* ── Career card ── */}
      <section className="card card--primary">
        <div className="career-header">
          <div>
            <p className="card-eyebrow">Recommended Career</p>
            <h2 className="career-title">{career}</h2>
          </div>
          <div className="confidence-ring" style={{ "--pct": confidence }}>
            <span className="confidence-num">{confidence}%</span>
            <span className="confidence-lbl">match</span>
          </div>
        </div>

        {alternatives?.length > 0 && (
          <div className="alt-section">
            <p className="section-label">Other Possibilities</p>
            <div className="alt-row">
              {alternatives.map((a) => (
                <AlternativeCard key={a.career} {...a} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Detected skills ── */}
      <section className="card">
        <p className="card-eyebrow">Detected Skills ({detected_skills.length})</p>
        <div className="badge-group">
          {detected_skills.map((s) => (
            <SkillBadge key={s} label={s} variant="detected" />
          ))}
        </div>
      </section>

      {/* ── Skill gap ── */}
      <section className="card">
        <div className="gap-header">
          <p className="card-eyebrow">Skill Gap Analysis — {career}</p>
          <span className="match-pct" style={{ color: matchColor }}>
            {match_percentage}% ready
          </span>
        </div>
        <ProgressBar pct={match_percentage} color={matchColor} />

        <div className="two-col">
          <div>
            <p className="section-label">
              ✅ You Have ({matched_skills.length}/{required_skills.length})
            </p>
            <div className="badge-group">
              {matched_skills.length
                ? matched_skills.map((s) => <SkillBadge key={s} label={s} variant="matched" />)
                : <span className="empty-note">None matched yet</span>}
            </div>
          </div>

          <div>
            <p className="section-label">
              🎯 Skills to Learn ({missing_skills.length})
            </p>
            <div className="badge-group">
              {missing_skills.length
                ? missing_skills.map((s) => <SkillBadge key={s} label={s} variant="missing" />)
                : <span className="empty-note">You have all required skills! 🎉</span>}
            </div>
          </div>
        </div>
      </section>

      {/* ── Roadmap ── */}
      {missing_skills.length > 0 && (
        <section className="card card--roadmap">
          <p className="card-eyebrow">📍 Your Learning Roadmap</p>
          <ol className="roadmap-list">
            {missing_skills.slice(0, 5).map((s, i) => (
              <li key={s} className="roadmap-item">
                <span className="roadmap-num">0{i + 1}</span>
                <div>
                  <strong>{s}</strong>
                  <p className="roadmap-sub">
                    {roadmapTip(s)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function roadmapTip(skill) {
  const tips = {
    "python":            "Start with Python.org official tutorial, then move to small scripts.",
    "machine learning":  "Andrew Ng's ML course on Coursera is the gold standard starting point.",
    "react":             "Build 3 small projects: todo app, weather app, quiz app.",
    "sql":               "Practice on SQLZoo or Mode Analytics SQL tutorial.",
    "docker":            "Docker's own 'getting started' guide is excellent and hands-on.",
    "aws":               "AWS Free Tier + Cloud Practitioner certification is the entry path.",
    "nodejs":            "Follow the Node.js official 'Getting Started' guide + build a REST API.",
    "typescript":        "Add TypeScript to an existing JS project gradually.",
    "tensorflow":        "TensorFlow's official tutorials with Colab notebooks.",
    "pandas":            "Kaggle's free Pandas micro-course — 4 hours to proficiency.",
  };
  return tips[skill.toLowerCase()] || `Search for '${skill} crash course' on YouTube or freeCodeCamp.`;
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [mode, setMode]             = useState("text");
  const [file, setFile]             = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [result, setResult]         = useState(null);

  const DEMO_RESUME = `John Doe | Software Engineer
Email: john@example.com | GitHub: github.com/johndoe

SKILLS
Languages: Python, JavaScript, TypeScript, SQL
Frontend: React, HTML, CSS, Tailwind
Tools: Git, Docker, VS Code

EDUCATION
B.Tech Computer Science — 2024

PROJECTS
1. Weather Dashboard — React + REST API + CSS
2. Data Analysis Script — Python, Pandas, NumPy, Matplotlib
3. Portfolio Website — HTML, CSS, JavaScript

EXPERIENCE
Intern at TechCorp (2023): Built React components, wrote Python scripts for data processing.
`;

  const handleAnalyze = async () => {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      let res;
      if (mode === "pdf" && file) {
        const form = new FormData();
        form.append("file", file);
        res = await axios.post("/analyze/pdf", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        const text = resumeText.trim();
        if (!text) { setError("Please paste your resume text first."); setLoading(false); return; }
        res = await axios.post("/analyze/text", { text });
      }
      setResult(res.data);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Something went wrong. Is the backend running?";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">ResumeAI</span>
          </div>
          <p className="header-sub">Career Recommendation & Skill Gap Detector</p>
        </div>
      </header>

      <main className="main">
        {/* ── Upload panel ── */}
        <div className="panel panel--upload">
          <h1 className="panel-title">Analyze Your Resume</h1>
          <p className="panel-desc">
            Paste your resume text (or upload a PDF). Our ML model extracts your
            skills, recommends a career, and shows exactly what to learn next.
          </p>

          <UploadArea
            mode={mode}
            setMode={setMode}
            file={file}
            resumeText={resumeText}
            onFileSelect={setFile}
            onTextChange={setResumeText}
          />

          {mode === "text" && !resumeText && (
            <button
              className="demo-btn"
              onClick={() => setResumeText(DEMO_RESUME)}
            >
              Load Demo Resume
            </button>
          )}

          {error && <div className="error-box">{error}</div>}

          <button
            className="analyze-btn"
            onClick={handleAnalyze}
            disabled={loading || (mode === "pdf" && !file) || (mode === "text" && !resumeText)}
          >
            {loading ? (
              <><span className="spinner" /> Analyzing…</>
            ) : "Analyze Resume →"}
          </button>
        </div>

        {/* ── Results ── */}
        {result && (
          <div className="panel panel--results">
            <Results data={result} />
          </div>
        )}
      </main>

      <footer className="footer">
        Built with React · FastAPI · Scikit-learn &nbsp;|&nbsp; AI Resume Analyzer
      </footer>
    </div>
  );
}
