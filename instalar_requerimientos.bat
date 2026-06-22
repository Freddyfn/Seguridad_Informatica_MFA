@echo off
color 0A
title Instalacion de Requerimientos MFA

echo =======================================================
echo     INSTALADOR DE DEPENDENCIAS - PROYECTO 2 MFA
echo =======================================================
echo Este script instalara todos los modulos necesarios 
echo para el funcionamiento del servidor y la vista web.
echo.

echo [1/2] Instalando dependencias del Backend (Node.js/Express)...
cd backend
call npm install
cd ..
echo.

echo [2/2] Instalando dependencias del Frontend (React/Vite)...
cd frontend
call npm install
cd ..
echo.

echo =======================================================
echo     INSTALACION COMPLETADA EXITOSAMENTE
echo =======================================================
echo Todo esta listo. Ya puedes ejecutar el archivo "iniciar.bat" 
echo para levantar el prototipo.
echo.
pause
