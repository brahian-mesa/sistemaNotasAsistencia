import { useState, useEffect } from 'react'
import { DocumentTextIcon, BookmarkIcon, CalendarIcon } from '@heroicons/react/24/outline'
import * as api from '../utils/api'

export default function Notas() {
  const [notasPersonales, setNotasPersonales] = useState('')
  const [ultimaActualizacion, setUltimaActualizacion] = useState('')

  // Cargar notas personales de la base de datos al iniciar
  useEffect(() => {
    const cargarNotas = async () => {
      try {
        const notasDB = await api.getNotasPersonales();
        if (notasDB && notasDB.length > 0) {
          const ultimaNota = notasDB[notasDB.length - 1]; // Obtener la más reciente
          setNotasPersonales(ultimaNota.contenido || '');
          setUltimaActualizacion(new Date(ultimaNota.fecha_actualizacion).toLocaleString('es-CO'));
          console.log('📝 Notas personales cargadas desde la base de datos');
        } else {
          console.log('📝 No hay notas personales guardadas en la BD');
        }
      } catch (error) {
        console.error('Error cargando notas personales:', error);
      }
    }
    cargarNotas()
  }, [])

  // Guardar notas personales en la base de datos
  const guardarNotasPersonales = async (texto) => {
    try {
      setNotasPersonales(texto)
      const ahora = new Date()
      const fechaFormateada = ahora.toLocaleDateString('es-CO') + ' ' + ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      setUltimaActualizacion(fechaFormateada)

      // Guardar en la base de datos
      await api.addNotaPersonal({
        contenido: texto,
        fecha_actualizacion: ahora.toISOString()
      });
      console.log('📝 Notas personales guardadas en la base de datos');
    } catch (error) {
      console.error('Error guardando notas personales:', error);
    }
  }



  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-indigo-700 mb-6">📝 Bloc de Notas Personal - Docente</h1>

      {/* Bloc de Notas Personal */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-md p-6 border border-purple-200">
        <div className="flex items-center mb-4">
          <DocumentTextIcon className="h-6 w-6 text-purple-600 mr-3" />
          <h2 className="text-xl font-bold text-purple-800">📝 Bloc de Notas Personal</h2>
          <BookmarkIcon className="h-5 w-5 text-purple-500 ml-auto" />
        </div>

        <div className="mb-3">
          <textarea
            value={notasPersonales}
            onChange={(e) => guardarNotasPersonales(e.target.value)}
            placeholder="✍️ Escribe tus notas personales aquí...&#10;&#10;💡 Ideas para usar este bloc:&#10;• Recordatorios importantes&#10;• Observaciones sobre estudiantes&#10;• Ideas para clases futuras&#10;• Tareas pendientes&#10;• Reuniones y compromisos&#10;• Reflexiones pedagógicas&#10;• Notas de padres de familia&#10;&#10;💾 Tus notas se guardan automáticamente"
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
          <div className="flex items-center gap-3 text-xs">
            <span className="text-gray-500">
              📝 {notasPersonales.length} caracteres
            </span>
            <span className="text-purple-500">
              💾 Se guarda en archivo JSON
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => guardarNotasPersonales(notasPersonales + '\n\n📅 ' + new Date().toLocaleDateString('es-CO') + ':\n• ')}
            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs hover:bg-purple-200 transition-colors font-medium"
            title="Agregar fecha actual"
          >
            📅 + Fecha
          </button>
          <button
            onClick={() => guardarNotasPersonales(notasPersonales + '\n• ')}
            className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs hover:bg-pink-200 transition-colors font-medium"
            title="Agregar punto de lista"
          >
            📝 + Punto
          </button>
          <button
            onClick={() => guardarNotasPersonales(notasPersonales + '\n\n🎯 IMPORTANTE: ')}
            className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs hover:bg-yellow-200 transition-colors font-medium"
            title="Agregar nota importante"
          >
            ⭐ Importante
          </button>
          <button
            onClick={() => {
              if (confirm('¿Estás segura de que quieres limpiar todas las notas?')) {
                guardarNotasPersonales('')
              }
            }}
            className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs hover:bg-red-200 transition-colors font-medium"
            title="Limpiar todas las notas"
          >
            🗑️ Limpiar
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