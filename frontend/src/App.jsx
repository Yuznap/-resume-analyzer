import { useState, useCallback } from "react";
import "./App.css";

const API = "https://resume-analyzer-api-jl57.onrender.com";

const CAREER_ICONS = {
  "Web Developer": "🌐",
  "Full Stack Developer": "⚡",
  "AI/ML Engineer": "🤖",
  "Data Analyst": "📊",
  "Backend Developer": "🔧",
  "Android Developer": "📱",
  "Cloud Engineer": "☁️",
  "DevOps Engineer": "🔄",
};

export default function App() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // ── drag-and-drop ──────────────────────────────────────────────────────────
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") {
      setFile(dropped);
      setResult(null);
      setError(null);
    } else {
      setError("Only PDF files are supported.");
    }
  }, []);

  const onFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setResult(null);
      setError(null);
    }
  };

  // ── analyze ────────────────────────────────────────────────────────────────
  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(`${API}/analyze`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Analysis failed.");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <span className="logo-badge">AI</span>
          <div>
            <h1 className="site-title">Resume Analyzer</h1>
            <p className="site-sub">
              Career Recommendation & Skill Gap Detection
            </p>
          </div>
        </div>
      </header>

      <main className="main">
        {!result ? (
          /* ── Upload Panel ── */
          <div className="upload-card">
            <div
              className={`dropzone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => document.getElementById("file-input").click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".pdf"
                style={{ display: "none" }}
                onChange={onFileChange}
              />
              {file ? (
                <div className="file-selected">
                  <div className="file-icon">📄</div>
                  <p className="file-name">{file.name}</p>
                  <p className="file-size">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div className="drop-prompt">
                  <div className="drop-icon">⬆</div>
                  <p className="drop-title">Drop your resume here</p>
                  <p className="drop-sub">or click to browse — PDF only</p>
                </div>
              )}
            </div>

            {error && <div className="error-box">⚠ {error}</div>}

            <button
              className="btn-analyze"
              disabled={!file || loading}
              onClick={analyze}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner" /> Analyzing…
                </span>
              ) : (
                "Analyze Resume"
              )}
            </button>

            {/* How it works */}
            <div className="how-it-works">
              <p className="how-label">How it works</p>
              <div className="steps">
                {[
                  "Upload PDF",
                  "Extract Skills",
                  "ML Prediction",
                  "Skill Gap",
                ].map((s, i) => (
                  <div key={i} className="step">
                    <span className="step-num">{i + 1}</span>
                    <span className="step-text">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ── Results ── */
          <div className="results">
            {/* Top card */}
            <div className="career-hero">
              <div className="career-emoji">
                {CAREER_ICONS[result.recommended_career] || "🎯"}
              </div>
              <div className="career-info">
                <p className="career-label">Recommended Career</p>
                <h2 className="career-name">{result.recommended_career}</h2>
                <div className="match-bar-wrap">
                  <div
                    className="match-bar-fill"
                    style={{ width: `${result.match_percentage}%` }}
                  />
                </div>
                <p className="match-pct">
                  {result.match_percentage}% skill match
                </p>
              </div>
            </div>

            {/* Top 3 Predictions */}
            {result.top_careers?.length > 0 && (
              <section className="result-section">
                <h3 className="section-title">Top Career Predictions</h3>
                <div className="top-careers">
                  {result.top_careers.map((c, i) => (
                    <div
                      key={i}
                      className={`career-pill ${i === 0 ? "top" : ""}`}
                    >
                      <span className="cp-icon">
                        {CAREER_ICONS[c.career] || "🎯"}
                      </span>
                      <span className="cp-name">{c.career}</span>
                      <span className="cp-pct">{c.probability}%</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="two-col">
              {/* Detected Skills */}
              <section className="result-section">
                <h3 className="section-title">
                  <span className="dot green" /> Detected Skills
                  <span className="count-badge">
                    {result.detected_skills.length}
                  </span>
                </h3>
                <div className="tag-cloud">
                  {result.detected_skills.map((s) => (
                    <span key={s} className="tag tag-green">
                      {s}
                    </span>
                  ))}
                </div>
              </section>

              {/* Missing Skills */}
              <section className="result-section">
                <h3 className="section-title">
                  <span className="dot red" /> Skills to Learn
                  <span className="count-badge warn">
                    {result.missing_skills.length}
                  </span>
                </h3>
                {result.missing_skills.length === 0 ? (
                  <p className="all-good">🎉 You have all required skills!</p>
                ) : (
                  <div className="tag-cloud">
                    {result.missing_skills.map((s) => (
                      <span key={s} className="tag tag-red">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <button className="btn-reset" onClick={reset}>
              ← Analyze Another Resume
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
