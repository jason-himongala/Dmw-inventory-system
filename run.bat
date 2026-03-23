@echo off
REM Run Tailwind watch, start a local server, and generate simplified PEOS output.

cd /d "%~dp0"

echo 1) Starting Tailwind watch (rebuilds CSS on change)...
start "Tailwind Watch" cmd /k "npx.cmd tailwindcss -i resources/css/app.css -o public/css/app.css --watch"

echo 2) Generating simplified PEOS output...
start "Simplify PEOS" cmd /k ".venv\Scripts\python.exe scripts\simplify_peos.py & pause"

echo 3) Starting static server (opens http://localhost:3000)...
start "Static Server" cmd /k "npx.cmd serve public"

echo Done. Visit http://localhost:3000 in your browser.
pause
