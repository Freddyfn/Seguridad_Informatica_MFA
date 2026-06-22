@echo off
echo Reiniciando el proyecto...

cd /d "%~dp0"
call detener.bat

echo Esperando un par de segundos antes de iniciar...
timeout /t 2 /nobreak >nul

call iniciar.bat

echo Proyecto reiniciado correctamente.
