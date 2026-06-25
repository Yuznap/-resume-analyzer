#!/bin/bash
# setup.sh — Run this once to install everything and train the model

set -e
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║     AI Resume Analyzer — Setup Script       ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── Backend ────────────────────────────────────────────────────────────────────
echo "▶  Setting up Python backend..."
cd backend

# Create virtual environment if not present
if [ ! -d "venv" ]; then
  python3 -m venv venv
  echo "   ✅  Created virtual environment"
fi

source venv/bin/activate
pip install -r requirements.txt --quiet
echo "   ✅  Python packages installed"

# Train model
echo ""
echo "▶  Training ML model (takes ~10 seconds)..."
python train_model.py
echo "   ✅  Model trained and saved"

deactivate
cd ..

# ── Frontend ───────────────────────────────────────────────────────────────────
echo ""
echo "▶  Setting up React frontend..."
cd frontend
npm install --silent
echo "   ✅  Node packages installed"
cd ..

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   Setup complete! How to run the project:   ║"
echo "║                                              ║"
echo "║   Terminal 1 (backend):                     ║"
echo "║     cd backend                              ║"
echo "║     source venv/bin/activate                ║"
echo "║     uvicorn main:app --reload               ║"
echo "║                                             ║"
echo "║   Terminal 2 (frontend):                    ║"
echo "║     cd frontend                             ║"
echo "║     npm start                               ║"
echo "║                                             ║"
echo "║   Then open: http://localhost:3000          ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
