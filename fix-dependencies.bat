@echo off
echo 🔧 Solucionando problemas de dependencias y CSS...

REM Limpiar node_modules y package-lock.json
echo 🧹 Limpiando dependencias anteriores...
if exist "node_modules" (
    rmdir /s /q "node_modules"
    echo ✅ node_modules eliminado
) else (
    echo ℹ️ node_modules no existe
)

if exist "package-lock.json" (
    del "package-lock.json"
    echo ✅ package-lock.json eliminado
) else (
    echo ℹ️ package-lock.json no existe
)

REM Reinstalar dependencias
echo 📦 Reinstalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Error instalando dependencias
    pause
    exit /b 1
)
echo ✅ Dependencias instaladas correctamente

REM Verificar que el build funcione
echo 🔨 Probando build...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Error en build
    echo 💡 Revisa los errores anteriores y corrige los problemas
    pause
    exit /b 1
)
echo ✅ Build exitoso

echo.
echo ✅ ¡Dependencias corregidas!
echo.
echo 📋 Próximos pasos:
echo 1. Haz commit de los cambios:
echo    git add .
echo    git commit -m "Fix dependencies and CSS errors"
echo    git push
echo.
echo 2. En Vercel Dashboard:
echo    - Ve a Settings → Environment Variables
echo    - Agrega VITE_SUPABASE_URL = tu_url_de_supabase
echo    - Agrega VITE_SUPABASE_ANON_KEY = tu_clave_anonima
echo.
echo 3. Redespliega tu aplicación en Vercel
echo.
echo 🔗 URLs útiles:
echo - Vercel Dashboard: https://vercel.com/dashboard
echo - Supabase Dashboard: https://supabase.com/dashboard

pause