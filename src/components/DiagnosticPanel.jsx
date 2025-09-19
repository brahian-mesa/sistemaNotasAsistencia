import React, { useState, useEffect } from 'react';

const DiagnosticPanel = () => {
  const [diagnostics, setDiagnostics] = useState({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const runDiagnostics = () => {
      const results = {
        // Variables de entorno
        supabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
        supabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        
        // Valores de las variables (parcialmente ocultos por seguridad)
        supabaseUrlValue: import.meta.env.VITE_SUPABASE_URL ? 
          import.meta.env.VITE_SUPABASE_URL.substring(0, 20) + '...' : 'NO DEFINIDA',
        supabaseKeyValue: import.meta.env.VITE_SUPABASE_ANON_KEY ? 
          import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'NO DEFINIDA',
        
        // Información del navegador
        userAgent: navigator.userAgent,
        location: window.location.href,
        
        // Estado de la aplicación
        timestamp: new Date().toISOString(),
        
        // Errores en consola (si los hay)
        hasErrors: false
      };

      setDiagnostics(results);
    };

    runDiagnostics();
  }, []);

  // Solo mostrar en desarrollo o si hay un parámetro especial
  const shouldShow = isVisible || 
    import.meta.env.DEV || 
    window.location.search.includes('debug=true');

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-gray-800">🔍 Diagnóstico</h3>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="text-gray-500 hover:text-gray-700"
        >
          {isVisible ? '✕' : '⚙️'}
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">Supabase URL:</span>
          <span className={diagnostics.supabaseUrl ? 'text-green-600' : 'text-red-600'}>
            {diagnostics.supabaseUrl ? '✅' : '❌'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Supabase Key:</span>
          <span className={diagnostics.supabaseKey ? 'text-green-600' : 'text-red-600'}>
            {diagnostics.supabaseKey ? '✅' : '❌'}
          </span>
        </div>
        
        <div className="text-gray-500">
          <div>URL: {diagnostics.supabaseUrlValue}</div>
          <div>Key: {diagnostics.supabaseKeyValue}</div>
        </div>
        
        <div className="text-gray-500">
          <div>Location: {diagnostics.location}</div>
          <div>Time: {diagnostics.timestamp}</div>
        </div>
        
        {(!diagnostics.supabaseUrl || !diagnostics.supabaseKey) && (
          <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
            <p className="text-red-700 text-xs font-medium">
              ⚠️ Variables de entorno faltantes
            </p>
            <p className="text-red-600 text-xs mt-1">
              Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagnosticPanel;