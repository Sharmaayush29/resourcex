Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Starting Waste2Raw Platform (Backend + Frontend)" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

$backendPath = Join-Path $PSScriptRoot "backend"
$frontendPath = Join-Path $PSScriptRoot "frontend"

Write-Host "Launching FastAPI backend on http://127.0.0.1:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; .\venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"

Write-Host "Launching React Vite frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev"

Write-Host ""
Write-Host "Both servers started in separate windows." -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "==============================================" -ForegroundColor Cyan
