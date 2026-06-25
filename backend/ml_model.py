import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# 1. Define standard skills benchmarks for evaluation/gap detection
CAREER_SKILLS_MAP = {
    "Web Developer": ["html", "css", "javascript", "bootstrap", "tailwind"],
    "Full Stack Developer": ["html", "css", "javascript", "react", "node.js", "express.js", "mongodb", "sql"],
    "AI Engineer": ["python", "pandas", "numpy", "scikit-learn", "machine learning", "deep learning", "tensorflow", "pytorch"],
    "Data Analyst": ["python", "excel", "sql", "tableau", "power bi", "pandas", "data visualization"],
    "Cloud Engineer": ["aws", "azure", "docker", "kubernetes", "linux", "git", "devops"]
}

# 2. Synthetic Training Data Generation
data = []
for role, skill_list in CAREER_SKILLS_MAP.items():
    for i in range(50): 
        sampled_size = np.random.randint(2, len(skill_list) + 1)
        sampled_skills = np.random.choice(skill_list, sampled_size, replace=False)
        all_flattened = [s for sub in CAREER_SKILLS_MAP.values() for s in sub]
        noise = np.random.choice(all_flattened, np.random.randint(0, 2))
        combined = list(sampled_skills) + list(noise)
        
        data.append({
            "skills_text": " ".join(combined),
            "label": role
        })

df = pd.DataFrame(data)

# 3. Feature Extraction (TF-IDF) & Dataset Splitting
vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(df["skills_text"])
y = df["label"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 4. Model Training (Using Random Forest)
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

def extract_known_skills(text: str):
    text = text.lower()
    all_possible_skills = set([s for sub in CAREER_SKILLS_MAP.values() for s in sub])
    detected = [skill for skill in all_possible_skills if skill in text]
    return list(set(detected))

def predict_career_and_gaps(resume_text: str):
    detected_skills = extract_known_skills(resume_text)
    if not detected_skills:
        return {
            "detected_skills": [],
            "recommended_career": "Software Engineer (Generalist)",
            "missing_skills": ["html", "javascript", "python", "sql"]
        }
    
    skills_query_str = " ".join(detected_skills)
    vectorized_input = vectorizer.transform([skills_query_str])
    predicted_role = model.predict(vectorized_input)[0]
    
    ideal_skills = CAREER_SKILLS_MAP[predicted_role]
    missing_skills = [skill for skill in ideal_skills if skill not in detected_skills]
    
    return {
        "detected_skills": [s.title() for s in detected_skills],
        "recommended_career": predicted_role,
        "missing_skills": [s.title() for s in missing_skills]
    }
