# Script para solucionar problemas de dependencias y CSS en PowerShell

Write-Host "🔧 Solucionando problemas de dependencias y CSS..." -ForegroundColor Green

# Limpiar node_modules y package-lock.json
Write-Host "🧹 Limpiando dependencias anteriores..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "✅ node_modules eliminado" -ForegroundColor Green
} else {
    Write-Host "ℹ️ node_modules no existe" -ForegroundColor Blue
}

if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
    Write-Host "✅ package-lock.json eliminado" -ForegroundColor Green
} else {
    Write-Host "ℹ️ package-lock.json no existe" -ForegroundColor Blue
}

# Reinstalar dependencias
Write-Host "📦 Reinstalando dependencias..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✅ Dependencias instaladas correctamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Error instalando dependencias: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Verificar que el build funcione
Write-Host "🔨 Probando build..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "✅ Build exitoso" -ForegroundColor Green
} catch {
    Write-Host "❌ Error en build: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Revisa los errores anteriores y corrige los problemas" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✅ ¡Dependencias corregidas!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Haz commit de los cambios:" -ForegroundColor White
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m 'Fix dependencies and CSS errors'" -ForegroundColor Gray
Write-Host "   git push" -ForegroundColor Gray
Write-Host ""
Write-Host "2. En Vercel Dashboard:" -ForegroundColor White
Write-Host "   - Ve a Settings → Environment Variables" -ForegroundColor Gray
Write-Host "   - Agrega VITE_SUPABASE_URL = tu_url_de_supabase" -ForegroundColor Gray
Write-Host "   - Agrega VITE_SUPABASE_ANON_KEY = tu_clave_anonima" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Redespliega tu aplicación en Vercel" -ForegroundColor White
Write-Host ""
Write-Host "🔗 URLs útiles:" -ForegroundColor Cyan
Write-Host "- Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor Blue
Write-Host "- Supabase Dashboard: https://supabase.com/dashboard" -ForegroundColor Blue