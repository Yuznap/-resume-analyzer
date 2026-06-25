"""
train_model.py
Generates a synthetic dataset of skills → career labels,
trains a Random Forest classifier, and saves it as model.pkl.
Run once before starting the API: python train_model.py
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import pickle
import json

# ─── 1. Define careers and their required skill sets ─────────────────────────

CAREER_SKILLS = {
    "Web Developer": [
        "html", "css", "javascript", "bootstrap", "jquery", "tailwind",
        "responsive design", "sass", "webpack", "git"
    ],
    "Full Stack Developer": [
        "html", "css", "javascript", "react", "node.js", "express.js",
        "mongodb", "sql", "rest api", "git", "typescript"
    ],
    "AI/ML Engineer": [
        "python", "machine learning", "deep learning", "tensorflow", "pytorch",
        "scikit-learn", "numpy", "pandas", "nlp", "computer vision", "keras"
    ],
    "Data Analyst": [
        "python", "sql", "pandas", "numpy", "excel", "tableau", "power bi",
        "data visualization", "statistics", "r"
    ],
    "Backend Developer": [
        "python", "java", "node.js", "sql", "postgresql", "mongodb",
        "rest api", "docker", "redis", "microservices", "spring boot"
    ],
    "Android Developer": [
        "java", "kotlin", "android sdk", "xml", "firebase", "retrofit",
        "room database", "mvvm", "git", "jetpack compose"
    ],
    "Cloud Engineer": [
        "aws", "azure", "gcp", "docker", "kubernetes", "terraform",
        "linux", "ci/cd", "networking", "security", "python"
    ],
    "DevOps Engineer": [
        "docker", "kubernetes", "jenkins", "github actions", "linux",
        "bash", "terraform", "ansible", "ci/cd", "monitoring", "python"
    ],
}

ALL_SKILLS = sorted(set(s for skills in CAREER_SKILLS.values() for s in skills))
CAREER_LABELS = list(CAREER_SKILLS.keys())

# ─── 2. Build synthetic training data ────────────────────────────────────────

def make_sample(career, noise=0.15):
    required = CAREER_SKILLS[career]
    row = {}
    for skill in ALL_SKILLS:
        if skill in required:
            row[skill] = 1 if np.random.rand() > 0.2 else 0
        else:
            row[skill] = 1 if np.random.rand() < noise else 0
    return row

SAMPLES_PER_CAREER = 300
rows, labels = [], []
for career in CAREER_LABELS:
    for _ in range(SAMPLES_PER_CAREER):
        rows.append(make_sample(career))
        labels.append(career)

df = pd.DataFrame(rows, columns=ALL_SKILLS)
y = pd.Series(labels)

# ─── 3. Train / evaluate three models, keep the best ─────────────────────────

X_train, X_test, y_train, y_test = train_test_split(
    df, y, test_size=0.2, random_state=42, stratify=y
)

models = {
    "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
    "Decision Tree":       DecisionTreeClassifier(max_depth=10, random_state=42),
    "Random Forest":       RandomForestClassifier(n_estimators=150, random_state=42),
}

best_name, best_model, best_acc = None, None, 0.0
print("\n── Model Comparison ──────────────────────")
for name, clf in models.items():
    clf.fit(X_train, y_train)
    acc = accuracy_score(y_test, clf.predict(X_test))
    marker = " <- best" if acc > best_acc else ""
    print(f"  {name:<25} Accuracy: {acc:.4f}{marker}")
    if acc > best_acc:
        best_acc, best_name, best_model = acc, name, clf

print(f"\nSaving '{best_name}' (accuracy={best_acc:.4f}) as model.pkl")

with open("model.pkl", "wb") as f:
    pickle.dump(best_model, f)

with open("features.json", "w") as f:
    json.dump(ALL_SKILLS, f)

with open("career_skills.json", "w") as f:
    json.dump(CAREER_SKILLS, f)

print("Saved: model.pkl, features.json, career_skills.json")
