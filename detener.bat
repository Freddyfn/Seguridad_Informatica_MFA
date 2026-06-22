@echo off
echo Deteniendo procesos del proyecto...

:: Cierra las ventanas de CMD con los titulos establecidos
taskkill /FI "WINDOWTITLE eq Seguridad_Informatica_Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Seguridad_Informatica_Frontend*" /T /F >nul 2>&1

:: Elimina procesos en los puertos 3000 (Backend) y 5173 (Frontend) por seguridad
for /f "tokens=5" %%a in ('netstat -a -n -o ^| findstr :3000') do (
    if not "%%a"=="0" taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -a -n -o ^| findstr :5173') do (
    if not "%%a"=="0" taskkill /F /PID %%a >nul 2>&1
)

echo Procesos detenidos correctamente.
