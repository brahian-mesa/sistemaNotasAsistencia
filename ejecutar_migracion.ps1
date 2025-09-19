# =====================================================
# Script para ejecutar migración de documento a codigo
# =====================================================

Write-Host "🚀 Ejecutando migración para cambiar 'documento' por 'codigo'..." -ForegroundColor Green

# Verificar que el archivo de migración existe
if (-not (Test-Path "MIGRACION_DOCUMENTO_A_CODIGO.sql")) {
    Write-Host "❌ Error: No se encontró el archivo MIGRACION_DOCUMENTO_A_CODIGO.sql" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Instrucciones para ejecutar la migración:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Ve a tu panel de Supabase (https://supabase.com/dashboard)" -ForegroundColor White
Write-Host "2. Selecciona tu proyecto" -ForegroundColor White
Write-Host "3. Ve a la sección 'SQL Editor'" -ForegroundColor White
Write-Host "4. Copia y pega el contenido del archivo MIGRACION_DOCUMENTO_A_CODIGO.sql" -ForegroundColor White
Write-Host "5. Ejecuta la consulta" -ForegroundColor White
Write-Host ""
Write-Host "📄 Contenido del archivo de migración:" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Get-Content "MIGRACION_DOCUMENTO_A_CODIGO.sql"
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Después de ejecutar la migración, el error debería estar resuelto." -ForegroundColor Green
Write-Host "🔄 Reinicia tu aplicación para que los cambios surtan efecto." -ForegroundColor Green
Write-Host ""
Write-Host "ℹ️  Esta migración renombra la columna 'documento' a 'codigo' para ser consistente." -ForegroundColor Blue