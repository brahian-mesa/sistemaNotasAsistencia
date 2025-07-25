@echo off
echo Configurando repositorio Git y subiendo a GitHub...
echo.

REM Inicializar repositorio git
git init
echo Repositorio Git inicializado.

REM Agregar remote origin
git remote add origin https://github.com/brahian-mesa/Sistema-Asistencia-Notas.git
echo Remote origin agregado.

REM Agregar todos los archivos
git add .
echo Archivos agregados al staging.

REM Hacer commit inicial
git commit -m "Initial commit: Sistema de Asistencia y Notas completo con funcionalidad de temas"
echo Commit realizado.

REM Configurar rama principal
git branch -M main
echo Rama principal configurada.

REM Push al repositorio remoto
git push -u origin main
echo.
echo ¡Proyecto subido a GitHub exitosamente!
echo Repositorio: https://github.com/brahian-mesa/Sistema-Asistencia-Notas.git
echo.
pause 