import { useState, useEffect } from 'react'
import * as api from '../utils/api'

export default function NotasPersonales() {
  const [notas, setNotas] = useState([])

  const [nuevaNota, setNuevaNota] = useState({
    titulo: '',
    contenido: '',
    fecha: new Date().toISOString().split('T')[0]
  })

  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  // Cargar notas personales de la base de datos al iniciar
  useEffect(() => {
    const cargarNotas = async () => {
      try {
        const notasDB = await api.getNotasPersonales()
        setNotas(notasDB)
        console.log('📝 Notas personales cargadas desde la base de datos:', notasDB.length)
      } catch (error) {
        console.error('Error cargando notas personales:', error)
      }
    }
    cargarNotas()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNuevaNota({
      ...nuevaNota,
      [name]: value
    })
  }

  const agregarNota = async () => {
    if (nuevaNota.titulo && nuevaNota.contenido) {
      try {
        const notaGuardada = await api.addNotaPersonal({
          titulo: nuevaNota.titulo,
          contenido: nuevaNota.contenido,
          fecha: nuevaNota.fecha
        })

        const notasActualizadas = await api.getNotasPersonales()
        setNotas(notasActualizadas)

        setNuevaNota({
          titulo: '',
          contenido: '',
          fecha: new Date().toISOString().split('T')[0]
        })
        setMostrarFormulario(false)
        console.log('✅ Nota personal guardada en la base de datos:', notaGuardada)
      } catch (error) {
        console.error('Error guardando nota personal:', error)
        alert('Error guardando la nota personal.')
      }
    }
  }

  const eliminarNota = async (id) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
      try {
        await api.deleteNotaPersonal(id)
        const notasActualizadas = await api.getNotasPersonales()
        setNotas(notasActualizadas)
        console.log('✅ Nota personal eliminada de la base de datos')
      } catch (error) {
        console.error('Error eliminando nota personal:', error)
        alert('Error eliminando la nota personal.')
      }
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-indigo-700 mb-6">Notas Personales</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Mis Notas</h2>
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            {mostrarFormulario ? 'Cancelar' : 'Nueva Nota'}
          </button>
        </div>

        {mostrarFormulario && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                type="text"
                name="titulo"
                value={nuevaNota.titulo}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Título de la nota"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
              <textarea
                name="contenido"
                value={nuevaNota.contenido}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows="3"
                placeholder="Escribe tu nota aquí..."
              ></textarea>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                name="fecha"
                value={nuevaNota.fecha}
                onChange={handleInputChange}
                className="p-2 border border-gray-300 rounded-md"
              />
            </div>
            <button
              onClick={agregarNota}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Guardar Nota
            </button>
          </div>
        )}

        <div className="space-y-4">
          {notas.length === 0 ? (
            <p className="text-gray-500">No hay notas registradas.</p>
          ) : (
            notas.map(nota => (
              <div key={nota.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">{nota.titulo}</h3>
                    <p className="text-gray-600">{nota.contenido}</p>
                    <p className="text-sm text-gray-500 mt-2">{nota.fecha}</p>
                  </div>
                  <button
                    onClick={() => eliminarNota(nota.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}