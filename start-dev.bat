@echo off
echo ==============================================
echo Starting Waste2Raw Platform (Backend + Frontend)
echo ==============================================
echo.
echo Launching FastAPI backend on http://127.0.0.1:8000 ...
start "Waste2Raw Backend (FastAPI)" cmd /k "cd /d %~dp0backend && .\venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"

echo Launching React/Vite frontend on http://localhost:5173 ...
start "Waste2Raw Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers are starting in separate windows.
echo Frontend: http://localhost:5173
echo Backend API Docs: http://127.0.0.1:8000/docs
echo ==============================================
