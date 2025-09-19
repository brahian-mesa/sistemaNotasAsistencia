import { useState, useEffect } from 'react'
import { DocumentTextIcon, BookmarkIcon, CalendarIcon } from '@heroicons/react/24/outline'
import db from '../utils/database'

export default function Notas() {
  const [notasPersonales, setNotasPersonales] = useState('')
  const [ultimaActualizacion, setUltimaActualizacion] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')

  // Cargar notas personales de Supabase al iniciar
  useEffect(() => {
    const cargarNotas = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 Cargando notas personales desde Supabase...');
        console.log('👤 Usuario actual:', db.getCurrentUser());
        
        const notasDB = await db.getNotasPersonales();
        console.log('📊 Datos recibidos de la BD:', notasDB);
        
        if (notasDB && notasDB.contenido) {
          setNotasPersonales(notasDB.contenido);
          setUltimaActualizacion(new Date(notasDB.updated_at).toLocaleString('es-CO'));
          console.log('✅ Notas personales cargadas desde Supabase:', notasDB.contenido.length, 'caracteres');
          console.log('📝 Contenido:', notasDB.contenido.substring(0, 100) + (notasDB.contenido.length > 100 ? '...' : ''));
        } else {
          console.log('📝 No hay notas personales guardadas en Supabase');
          setNotasPersonales('');
          setUltimaActualizacion('');
        }
      } catch (error) {
        console.error('❌ Error cargando notas personales desde Supabase:', error);
        console.error('❌ Detalles del error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        setSaveStatus('❌ Error cargando notas desde la base de datos');
      } finally {
        setIsLoading(false);
      }
    }
    cargarNotas()
  }, [])

  // Guardar notas personales en Supabase
  const guardarNotasPersonales = async (texto) => {
    try {
      setIsSaving(true);
      setSaveStatus('🔄 Guardando...');
      
      console.log('🔄 Iniciando guardado de notas personales:', {
        texto: texto.substring(0, 50) + (texto.length > 50 ? '...' : ''),
        longitud: texto.length,
        usuario: db.getCurrentUser()?.id
      });
      
      // Actualizar estado local inmediatamente para respuesta rápida
      setNotasPersonales(texto)
      const ahora = new Date()
      const fechaFormateada = ahora.toLocaleDateString('es-CO') + ' ' + ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      setUltimaActualizacion(fechaFormateada)

      // Guardar en Supabase
      const resultado = await db.guardarNotasPersonales(texto);
      console.log('✅ Notas personales guardadas en Supabase:', resultado);
      
      setSaveStatus('✅ Guardado correctamente');
      setTimeout(() => setSaveStatus(''), 3000);
      
    } catch (error) {
      console.error('❌ Error guardando notas personales en Supabase:', error);
      console.error('❌ Detalles del error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      setSaveStatus(`❌ Error al guardar: ${error.message}`);
      setTimeout(() => setSaveStatus(''), 5000);
    } finally {
      setIsSaving(false);
    }
  }

  // Función para limpiar todas las notas
  const limpiarNotas = async () => {
    try {
      setIsSaving(true);
      setSaveStatus('🔄 Limpiando notas...');
      
      // Limpiar en Supabase
      await db.guardarNotasPersonales('');
      
      // Actualizar estado local
      setNotasPersonales('');
      setUltimaActualizacion('');
      
      console.log('✅ Notas personales limpiadas correctamente');
      setSaveStatus('✅ Notas limpiadas correctamente');
      setTimeout(() => setSaveStatus(''), 3000);
      
    } catch (error) {
      console.error('❌ Error limpiando notas personales:', error);
      setSaveStatus(`❌ Error al limpiar: ${error.message}`);
      setTimeout(() => setSaveStatus(''), 5000);
    } finally {
      setIsSaving(false);
    }
  }



  // Mostrar loading mientras se cargan las notas
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold text-indigo-700 mb-6 flex items-center">
          <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Bloc de Notas Personal - Docente
        </h1>
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-md p-6 border border-purple-200">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-purple-600 font-medium">Cargando notas desde la base de datos...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-indigo-700 mb-6 flex items-center">
        <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Bloc de Notas Personal - Docente
      </h1>

      {/* Bloc de Notas Personal */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-md p-6 border border-purple-200">
        <div className="flex items-center mb-4">
          <DocumentTextIcon className="h-6 w-6 text-purple-600 mr-3" />
          <h2 className="text-xl font-bold text-purple-800">Bloc de Notas Personal</h2>
          <BookmarkIcon className="h-5 w-5 text-purple-500 ml-auto" />
        </div>

        <div className="mb-3">
          <textarea
            value={notasPersonales}
            onChange={(e) => guardarNotasPersonales(e.target.value)}
            placeholder="Escribe tus notas personales aquí...&#10;&#10;Ideas para usar este bloc:&#10;• Recordatorios importantes&#10;• Observaciones sobre estudiantes&#10;• Ideas para clases futuras&#10;• Tareas pendientes&#10;• Reuniones y compromisos&#10;• Reflexiones pedagógicas&#10;• Notas de padres de familia&#10;&#10;Tus notas se guardan automáticamente"
            className="w-full h-40 p-4 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white/80 backdrop-blur-sm text-gray-700 placeholder-gray-500"
            style={{ fontSize: '14px', lineHeight: '1.5' }}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-purple-600">
            <CalendarIcon className="h-4 w-4 mr-1" />
            {ultimaActualizacion ? (
              <span>Última actualización: {ultimaActualizacion}</span>
            ) : (
              <span>Sin cambios guardados</span>
            )}
          </div>
          {saveStatus && (
            <div className={`px-3 py-1 rounded-lg text-xs font-medium ${
              saveStatus.includes('✅') 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : saveStatus.includes('❌') 
                  ? 'bg-red-100 text-red-800 border border-red-200' 
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {saveStatus}
            </div>
          )}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-gray-500 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {notasPersonales.length} caracteres
            </span>
            <span className="text-purple-500 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Se guarda en archivo JSON
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => guardarNotasPersonales(notasPersonales + '\n\n' + new Date().toLocaleDateString('es-CO') + ':\n• ')}
            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs hover:bg-purple-200 transition-colors font-medium flex items-center"
            title="Agregar fecha actual"
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            + Fecha
          </button>
          <button
            onClick={() => guardarNotasPersonales(notasPersonales + '\n• ')}
            className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs hover:bg-pink-200 transition-colors font-medium flex items-center"
            title="Agregar punto de lista"
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            + Punto
          </button>
          <button
            onClick={() => guardarNotasPersonales(notasPersonales + '\n\nIMPORTANTE: ')}
            className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs hover:bg-yellow-200 transition-colors font-medium flex items-center"
            title="Agregar nota importante"
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Importante
          </button>
          <button
            onClick={() => {
              if (confirm('¿Estás segura de que quieres limpiar todas las notas?\n\nEsto eliminará permanentemente todo el contenido.')) {
                limpiarNotas();
              }
            }}
            disabled={isSaving}
            className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs hover:bg-red-200 transition-colors font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            title="Limpiar todas las notas"
          >
            {isSaving ? '🔄' : '🗑️'} Limpiar
          </button>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">💡</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Tips para organizar tus notas</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <p className="font-medium mb-2">📝 Organización:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Usa fechas para agrupar por días</li>
                  <li>• Marca temas importantes con ⭐</li>
                  <li>• Separa por materias o grupos</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">🎯 Seguimiento:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Anota comportamientos destacados</li>
                  <li>• Registra reuniones con padres</li>
                  <li>• Guarda ideas para actividades</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}