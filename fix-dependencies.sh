#!/bin/bash

echo "🔧 Solucionando problemas de dependencias y CSS..."

# Limpiar node_modules y package-lock.json
echo "🧹 Limpiando dependencias anteriores..."
rm -rf node_modules
rm -f package-lock.json

# Reinstalar dependencias
echo "📦 Reinstalando dependencias..."
npm install

# Verificar que el build funcione
echo "🔨 Probando build..."
npm run build

echo "✅ Dependencias corregidas!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Haz commit de los cambios:"
echo "   git add ."
echo "   git commit -m 'Fix Tailwind CSS configuration'"
echo "   git push"
echo ""
echo "2. En Vercel, configura las variables de entorno:"
echo "   VITE_SUPABASE_URL = tu_url_de_supabase"
echo "   VITE_SUPABASE_ANON_KEY = tu_clave_anonima"
echo ""
echo "3. Redespliega tu aplicación en Vercel"