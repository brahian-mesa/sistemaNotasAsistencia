# 🚀 Guía de Despliegue en Vercel

## Problema: Página en Blanco

Si tu aplicación se ve en blanco en Vercel, es muy probable que sea por **variables de entorno faltantes**.

## ✅ Solución Paso a Paso

### 1. Configurar Variables de Entorno en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **Environment Variables**
4. Agrega estas variables:

```
VITE_SUPABASE_URL = tu_url_de_supabase_aqui
VITE_SUPABASE_ANON_KEY = tu_clave_anonima_de_supabase_aqui
```

### 2. Obtener las Variables de Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### 3. Redesplegar

1. En Vercel, ve a **Deployments**
2. Haz clic en **Redeploy** en el último deployment
3. O haz un nuevo commit y push

## 🔍 Verificar el Problema

### Abrir Consola del Navegador
1. Abre tu sitio en Vercel
2. Presiona `F12` o `Ctrl+Shift+I`
3. Ve a la pestaña **Console**
4. Busca errores como:
   - `VITE_SUPABASE_URL is not defined`
   - `VITE_SUPABASE_ANON_KEY is not defined`
   - `Failed to fetch`

### Verificar Variables en Vercel
1. En Vercel Dashboard → Settings → Environment Variables
2. Asegúrate de que las variables estén configuradas para **Production**
3. Verifica que los valores sean correctos (sin espacios extra)

## 🛠️ Configuración Adicional

### Archivo vercel.json
Ya se creó un archivo `vercel.json` con la configuración correcta para Vite.

### Build Settings
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## 🚨 Errores Comunes

### 1. Variables de Entorno Vacías
```
Error: VITE_SUPABASE_URL is not defined
```
**Solución**: Configurar las variables en Vercel

### 2. URL Incorrecta
```
Error: Failed to fetch
```
**Solución**: Verificar que la URL de Supabase sea correcta

### 3. Clave Incorrecta
```
Error: Invalid API key
```
**Solución**: Verificar que la clave anónima sea correcta

### 4. CORS Issues
```
Error: CORS policy
```
**Solución**: Verificar configuración de CORS en Supabase

## 📋 Checklist de Despliegue

- [ ] Variables de entorno configuradas en Vercel
- [ ] URL de Supabase correcta
- [ ] Clave anónima de Supabase correcta
- [ ] Build exitoso en Vercel
- [ ] No errores en consola del navegador
- [ ] Aplicación carga correctamente

## 🔧 Comandos Útiles

### Build Local
```bash
npm run build
npm run preview
```

### Verificar Variables
```bash
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

## 📞 Soporte

Si el problema persiste:
1. Revisa los logs de Vercel en **Functions** → **View Function Logs**
2. Verifica la consola del navegador
3. Asegúrate de que Supabase esté funcionando correctamente