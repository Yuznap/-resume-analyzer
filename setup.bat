@echo off
echo.
echo  AI Resume Analyzer - Setup Script (Windows)
echo  ============================================
echo.

echo [1/4] Creating Python virtual environment...
cd backend
python -m venv venv
call venv\Scripts\activate.bat

echo [2/4] Installing Python packages...
pip install -r requirements.txt

echo [3/4] Training ML model...
python train_model.py
call venv\Scripts\deactivate.bat
cd ..

echo [4/4] Installing Node packages...
cd frontend
npm install
cd ..

echo.
echo  Setup complete!
echo.
echo  To run the project:
echo.
echo  Terminal 1 (backend):
echo    cd backend
echo    venv\Scripts\activate
echo    uvicorn main:app --reload
echo.
echo  Terminal 2 (frontend):
echo    cd frontend
echo    npm start
echo.
echo  Then open: http://localhost:3000
echo.
pause
