@echo off
echo Iniciando el backend y frontend de Seguridad_Informatica...

cd /d "%~dp0"

echo [1/2] Iniciando Backend...
start "Seguridad_Informatica_Backend" cmd /k "title Seguridad_Informatica_Backend && cd backend && node server.js"

echo [2/2] Iniciando Frontend...
start "Seguridad_Informatica_Frontend" cmd /k "title Seguridad_Informatica_Frontend && cd frontend && npm run dev"

echo Proyecto iniciado con exito en ventanas separadas.
