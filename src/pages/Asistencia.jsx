import { useState, useEffect } from 'react'
import { ChevronDownIcon, ChevronUpIcon, UserGroupIcon, CalendarIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import PageContainer from '../components/PageContainer'
import * as XLSX from 'xlsx'
import db from '../utils/database'

export default function Asistencia() {
    const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0])
    const [asistencias, setAsistencias] = useState({})
    const [showEstadisticas, setShowEstadisticas] = useState(false)
    const [diasFestivos, setDiasFestivos] = useState([])

    // Cargar datos desde la base de datos - igual que en Materias
    const [materias, setMaterias] = useState([])
    const [estudiantes, setEstudiantes] = useState([])

    // Estados para indicador de guardado automático
    const [autoSaveStatus, setAutoSaveStatus] = useState('')

    // Función para mostrar estado de guardado
    const mostrarEstadoGuardado = (mensaje) => {
        setAutoSaveStatus(mensaje)
        setTimeout(() => setAutoSaveStatus(''), 2000)
    }

    // Cargar datos al inicializar - igual que en Materias
    useEffect(() => {
        cargarDatos()
    }, [])

    const cargarDatos = () => {
        try {
            const materiasDB = db.getMaterias()
            const estudiantesDB = db.getEstudiantes()

            setMaterias(materiasDB)
            setEstudiantes(estudiantesDB)

            console.log('✅ Datos cargados desde la base de datos:')
            console.log('📚 Materias:', materiasDB.length)
            console.log('👥 Estudiantes:', estudiantesDB.length)
        } catch (error) {
            console.error('❌ Error cargando datos:', error)
        }
    }

    // Obtener día de la semana
    const obtenerDiaSemana = (fecha) => {
        const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
        const fechaObj = new Date(fecha + 'T12:00:00')
        return dias[fechaObj.getDay()]
    }

    // Filtrar materias que se dan en el día seleccionado
    const materiasDelDia = materias.filter(materia => {
        const diaSemana = obtenerDiaSemana(fechaSeleccionada)
        return materia.horario && materia.horario.toLowerCase().includes(diaSemana)
    })

    // Obtener asistencias desde localStorage - igual que notas en Materias
    useEffect(() => {
        const asistenciasGuardadas = localStorage.getItem('sistema_escolar_asistencias')
        if (asistenciasGuardadas) {
            try {
                const todasAsistencias = JSON.parse(asistenciasGuardadas)

                // Convertir a formato del estado local para la fecha seleccionada
                const asistenciasFormateadas = {}
                const asistenciasFecha = todasAsistencias.filter(a => a.fecha === fechaSeleccionada)

                // Agrupar por estudiante
                const asistenciasPorEstudiante = {}
                asistenciasFecha.forEach(asistencia => {
                    if (!asistenciasPorEstudiante[asistencia.estudiante_id]) {
                        asistenciasPorEstudiante[asistencia.estudiante_id] = asistencia.estado
                    }
                })

                // Convertir al formato esperado
                Object.entries(asistenciasPorEstudiante).forEach(([estudianteId, estado]) => {
                    const clave = `${fechaSeleccionada}-${estudianteId}`
                    asistenciasFormateadas[clave] = {
                        estudianteId: parseInt(estudianteId),
                        fecha: fechaSeleccionada,
                        estado: estado
                    }
                })

                setAsistencias(asistenciasFormateadas)
                console.log('✅ Asistencias cargadas:', Object.keys(asistenciasFormateadas).length)
            } catch (error) {
                console.error('❌ Error cargando asistencias:', error)
            }
        }
    }, [fechaSeleccionada])

    // Manejar cambio de asistencia - guardado automático como en Materias
    const manejarAsistencia = (estudianteId, estado) => {
        const clave = `${fechaSeleccionada}-${estudianteId}`

        // Actualizar estado local
        setAsistencias(prev => ({
            ...prev,
            [clave]: {
                estudianteId: parseInt(estudianteId),
                fecha: fechaSeleccionada,
                estado: estado
            }
        }))

        // Guardar automáticamente en localStorage - igual que en Materias
        try {
            // Obtener todas las asistencias existentes
            const asistenciasExistentes = JSON.parse(localStorage.getItem('sistema_escolar_asistencias') || '[]')

            // Eliminar asistencias existentes para este estudiante en esta fecha
            const asistenciasFiltradas = asistenciasExistentes.filter(a =>
                !(a.estudiante_id === parseInt(estudianteId) && a.fecha === fechaSeleccionada)
            )

            // Crear nuevas asistencias para cada materia del día
            const nuevasAsistencias = materiasDelDia.map(materia => ({
                id: Date.now() + Math.random(),
                estudiante_id: parseInt(estudianteId),
                materia_id: materia.id,
                fecha: fechaSeleccionada,
                estado: estado,
                created_at: new Date().toISOString()
            }))

            // Guardar todas las asistencias
            const todasLasAsistencias = [...asistenciasFiltradas, ...nuevasAsistencias]
            localStorage.setItem('sistema_escolar_asistencias', JSON.stringify(todasLasAsistencias))

            mostrarEstadoGuardado('✅ Guardado automáticamente')
            console.log(`✅ Asistencia guardada: ${estado} para estudiante ${estudianteId}`)

        } catch (error) {
            console.error('❌ Error guardando asistencia:', error)
            mostrarEstadoGuardado('❌ Error al guardar')
        }
    }

    // Obtener estado de asistencia
    const obtenerAsistencia = (estudianteId) => {
        const clave = `${fechaSeleccionada}-${estudianteId}`
        return asistencias[clave]?.estado || ''
    }

    // Calcular estadísticas de faltas
    const calcularEstadisticasFaltas = () => {
        try {
            const asistenciasGuardadas = JSON.parse(localStorage.getItem('sistema_escolar_asistencias') || '[]')
            const estadisticas = []

            estudiantes.forEach(estudiante => {
                const faltasPorMateria = {}

                // Inicializar contadores
                materias.forEach(materia => {
                    faltasPorMateria[materia.codigo] = 0
                })

                // Contar faltas - UNA por día, no por materia
                const fechasConFaltas = new Set()
                asistenciasGuardadas.forEach(asistencia => {
                    if (asistencia.estudiante_id === estudiante.id && asistencia.estado === 'ausente') {
                        fechasConFaltas.add(asistencia.fecha)
                    }
                })

                // Para cada fecha con falta, incrementar SOLO las materias de ese día
                fechasConFaltas.forEach(fecha => {
                    const diaSemana = obtenerDiaSemana(fecha)
                    const materiasDeEseDia = materias.filter(materia =>
                        materia.horario && materia.horario.toLowerCase().includes(diaSemana)
                    )

                    materiasDeEseDia.forEach(materia => {
                        if (faltasPorMateria[materia.codigo] !== undefined) {
                            faltasPorMateria[materia.codigo]++
                        }
                    })
                })

                estadisticas.push({
                    estudiante: estudiante.nombre,
                    codigoEstudiante: estudiante.codigo,
                    faltasPorMateria: faltasPorMateria
                })
            })

            return estadisticas
        } catch (error) {
            console.error('❌ Error calculando estadísticas:', error)
            return []
        }
    }

    // Exportar a Excel con TODAS las asistencias guardadas
    const exportarAsistenciaExcel = () => {
        try {
            // Obtener TODAS las asistencias guardadas
            const asistenciasGuardadas = JSON.parse(localStorage.getItem('sistema_escolar_asistencias') || '[]')

            if (asistenciasGuardadas.length === 0) {
                alert('⚠️ No hay asistencias guardadas para exportar.')
                return
            }

            // Obtener todas las fechas únicas
            const fechasUnicas = [...new Set(asistenciasGuardadas.map(a => a.fecha))].sort()

            // Convertir asistencias a formato fácil de usar
            const asistenciasFormateadas = {}
            asistenciasGuardadas.forEach(asistencia => {
                const clave = `${asistencia.fecha}-${asistencia.estudiante_id}`
                asistenciasFormateadas[clave] = asistencia.estado
            })

            // Encabezado institucional
            const datosHoja = []
            datosHoja.push(['🏫', 'Institución Educativa Nuestra Señora De los Dolores'])
            datosHoja.push(['', 'REGISTRO COMPLETO DE ASISTENCIA'])
            datosHoja.push(['', 'Sede Salvador Duque, grado 5B'])
            datosHoja.push(['', `Período: ${fechasUnicas[0]} a ${fechasUnicas[fechasUnicas.length - 1]}`])
            datosHoja.push(['', `Total de días registrados: ${fechasUnicas.length}`])
            datosHoja.push([])

            // Encabezados de tabla
            const encabezados = ['N°', 'NOMBRE DEL ESTUDIANTE']
            fechasUnicas.forEach(fecha => {
                const fechaObj = new Date(fecha + 'T12:00:00')
                encabezados.push(fechaObj.getDate().toString())
            })
            encabezados.push('Total Faltas')
            datosHoja.push(encabezados)

            // Datos de estudiantes
            estudiantes.forEach((estudiante, index) => {
                const filaEstudiante = [index + 1, estudiante.nombre]
                let totalFaltas = 0

                fechasUnicas.forEach(fecha => {
                    const claveAsistencia = `${fecha}-${estudiante.id}`
                    const estadoAsistencia = asistenciasFormateadas[claveAsistencia]

                    let valorCelda = ''
                    if (estadoAsistencia === 'presente') {
                        valorCelda = 'X'
                    } else if (estadoAsistencia === 'ausente') {
                        valorCelda = 'F'
                        totalFaltas++
                    }
                    filaEstudiante.push(valorCelda)
                })

                filaEstudiante.push(totalFaltas)
                datosHoja.push(filaEstudiante)
            })

            // Crear workbook y worksheet
            const wb = XLSX.utils.book_new()
            const ws = XLSX.utils.aoa_to_sheet(datosHoja)

            // Ajustar ancho de columnas
            const colWidths = [
                { wch: 5 },  // N°
                { wch: 30 }, // Nombre
                ...fechasUnicas.map(() => ({ wch: 4 })), // Días
                { wch: 8 }   // Total
            ]
            ws['!cols'] = colWidths

            XLSX.utils.book_append_sheet(wb, ws, 'Asistencia')

            // Nombre del archivo
            const nombreArchivo = `asistencia_completa_${fechasUnicas[0]}_a_${fechasUnicas[fechasUnicas.length - 1]}.xlsx`

            XLSX.writeFile(wb, nombreArchivo)

            alert(`✅ EXCEL EXPORTADO EXITOSAMENTE!\n\n📊 Resumen:\n• ${fechasUnicas.length} días con datos\n• ${asistenciasGuardadas.length} registros totales\n• Todas las asistencias guardadas incluidas\n\n💾 Archivo: ${nombreArchivo}`)

        } catch (error) {
            console.error('❌ Error exportando Excel:', error)
            alert('❌ Error al exportar archivo Excel')
        }
    }

    // Obtener días festivos (función simulada)
    const obtenerDiasFestivos = async (año) => {
        return [
            `${año}-01-01`, // Año nuevo
            `${año}-05-01`, // Día del trabajo
            `${año}-07-20`, // Día de la independencia
            `${año}-12-25`  // Navidad
        ]
    }

    // Cargar días festivos
    useEffect(() => {
        const año = new Date(fechaSeleccionada).getFullYear()
        obtenerDiasFestivos(año).then(festivos => {
            setDiasFestivos(festivos)
        })
    }, [fechaSeleccionada])

    const estadisticas = calcularEstadisticasFaltas()

    return (
        <PageContainer title="Control de Asistencia - Grado 5B" subtitle="Registro diario de asistencia">
            <div className="space-y-6 p-4 md:p-6 min-h-screen pb-6">

                {/* Indicador de guardado automático */}
                {autoSaveStatus && (
                    <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-lg shadow-lg">
                        {autoSaveStatus}
                    </div>
                )}

                {/* Selector de fecha */}
                <div className="bg-white/95 p-4 md:p-6 rounded-xl shadow-lg border border-white/40 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <CalendarIcon className="h-8 w-8 text-purple-600 mr-3" />
                            <h2 className="text-xl md:text-2xl font-bold text-purple-800">
                                Seleccionar Fecha
                            </h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <input
                            type="date"
                            value={fechaSeleccionada}
                            onChange={(e) => setFechaSeleccionada(e.target.value)}
                            className="px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <span className="text-purple-700 font-medium">
                            {obtenerDiaSemana(fechaSeleccionada).charAt(0).toUpperCase() + obtenerDiaSemana(fechaSeleccionada).slice(1)}
                        </span>
                    </div>
                </div>

                {/* Tabla de Asistencia */}
                {materiasDelDia.length > 0 && (
                    <div className="bg-white/95 p-4 md:p-6 rounded-xl shadow-lg border border-white/40 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <ChartBarIcon className="h-8 w-8 text-purple-600 mr-3" />
                                <h2 className="text-xl md:text-2xl font-bold text-purple-800">
                                    Registro de Asistencia
                                </h2>
                            </div>
                        </div>

                        <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <p className="text-purple-800">
                                <strong>Día:</strong> {obtenerDiaSemana(fechaSeleccionada).charAt(0).toUpperCase() + obtenerDiaSemana(fechaSeleccionada).slice(1)} - {fechaSeleccionada}
                            </p>
                            <p className="text-purple-700">
                                <strong>Materias:</strong> {materiasDelDia.map(m => m.nombre).join(', ')}
                            </p>
                        </div>

                        <div className="overflow-auto max-h-[400px] border border-purple-200 rounded-lg">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-purple-50">
                                        <th className="border border-purple-200 p-3 text-left text-purple-800 font-bold">Código</th>
                                        <th className="border border-purple-200 p-3 text-left text-purple-800 font-bold">Estudiante</th>
                                        <th className="border border-purple-200 p-3 text-center text-purple-800 font-bold">Asistencia</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {estudiantes.map((estudiante) => {
                                        const asistenciaActual = obtenerAsistencia(estudiante.id)
                                        return (
                                            <tr key={estudiante.id} className="hover:bg-purple-25">
                                                <td className="border border-purple-200 p-3 text-purple-700 font-medium">
                                                    {estudiante.codigo}
                                                </td>
                                                <td className="border border-purple-200 p-3 text-purple-900">
                                                    {estudiante.nombre}
                                                </td>
                                                <td className="border border-purple-200 p-3">
                                                    <div className="flex justify-center gap-4">
                                                        <label title="Presente" className="cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name={`asistencia-${estudiante.id}`}
                                                                checked={asistenciaActual === 'presente'}
                                                                onChange={() => manejarAsistencia(estudiante.id, 'presente')}
                                                                className="hidden"
                                                            />
                                                            <span className={`inline-flex items-center justify-center w-12 h-12 rounded-lg text-lg font-bold transition-all ${asistenciaActual === 'presente'
                                                                ? 'bg-green-500 text-white shadow-lg scale-110'
                                                                : 'bg-gray-200 hover:bg-green-200 hover:scale-105'
                                                                }`}>
                                                                ✅
                                                            </span>
                                                            {asistenciaActual === 'presente' && (
                                                                <div className="text-xs text-green-600 text-center mt-1 font-medium">
                                                                    ✓ Guardado
                                                                </div>
                                                            )}
                                                        </label>
                                                        <label title="Ausente" className="cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name={`asistencia-${estudiante.id}`}
                                                                checked={asistenciaActual === 'ausente'}
                                                                onChange={() => manejarAsistencia(estudiante.id, 'ausente')}
                                                                className="hidden"
                                                            />
                                                            <span className={`inline-flex items-center justify-center w-12 h-12 rounded-lg text-lg font-bold transition-all ${asistenciaActual === 'ausente'
                                                                ? 'bg-red-500 text-white shadow-lg scale-110'
                                                                : 'bg-gray-200 hover:bg-red-200 hover:scale-105'
                                                                }`}>
                                                                ❌
                                                            </span>
                                                            {asistenciaActual === 'ausente' && (
                                                                <div className="text-xs text-red-600 text-center mt-1 font-medium">
                                                                    ✓ Guardado
                                                                </div>
                                                            )}
                                                        </label>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                {(() => {
                                    const estudiantesRegistrados = estudiantes.filter(est => obtenerAsistencia(est.id) !== '').length
                                    return `${estudiantesRegistrados} de ${estudiantes.length} estudiantes registrados`
                                })()}
                            </div>
                            <div className="flex gap-3 flex-wrap">
                                <button
                                    onClick={() => setShowEstadisticas(!showEstadisticas)}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                                >
                                    📈 {showEstadisticas ? 'Ocultar' : 'Ver'} Estadísticas
                                </button>
                                <button
                                    onClick={exportarAsistenciaExcel}
                                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                                >
                                    📊 Exportar a Excel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mostrar mensaje si no hay materias programadas */}
                {materiasDelDia.length === 0 && (
                    <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                        <div className="flex items-center">
                            <UserGroupIcon className="h-8 w-8 text-yellow-600 mr-3" />
                            <div>
                                <h3 className="text-lg font-bold text-yellow-800">
                                    No hay materias programadas
                                </h3>
                                <p className="text-yellow-700">
                                    No hay materias programadas para el {obtenerDiaSemana(fechaSeleccionada)} {fechaSeleccionada}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabla de estadísticas */}
                {showEstadisticas && estadisticas.length > 0 && (
                    <div className="bg-white/95 p-4 md:p-6 rounded-xl shadow-lg border border-white/40 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <ChartBarIcon className="h-8 w-8 text-blue-600 mr-3" />
                                <h2 className="text-xl md:text-2xl font-bold text-blue-800">
                                    Estadísticas de Faltas por Materia
                                </h2>
                            </div>
                            <button
                                onClick={() => setShowEstadisticas(false)}
                                className="text-blue-600 hover:text-blue-800"
                            >
                                <ChevronUpIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="overflow-auto max-h-[500px] border border-blue-200 rounded-lg">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-blue-50">
                                        <th className="border border-blue-200 p-3 text-left text-blue-800 font-bold">Código</th>
                                        <th className="border border-blue-200 p-3 text-left text-blue-800 font-bold">Estudiante</th>
                                        {materias.map(materia => (
                                            <th key={materia.codigo} className="border border-blue-200 p-3 text-center text-blue-800 font-bold">
                                                {materia.nombre}
                                            </th>
                                        ))}
                                        <th className="border border-blue-200 p-3 text-center text-blue-800 font-bold">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {estadisticas.map((est, index) => {
                                        const totalFaltas = Object.values(est.faltasPorMateria).reduce((sum, faltas) => sum + faltas, 0)
                                        return (
                                            <tr key={index} className="hover:bg-blue-25">
                                                <td className="border border-blue-200 p-3 text-blue-700 font-medium">
                                                    {est.codigoEstudiante}
                                                </td>
                                                <td className="border border-blue-200 p-3 text-blue-900">
                                                    {est.estudiante}
                                                </td>
                                                {materias.map(materia => (
                                                    <td key={materia.codigo} className="border border-blue-200 p-3 text-center">
                                                        <span className={`inline-block px-2 py-1 rounded text-sm font-bold ${est.faltasPorMateria[materia.codigo] > 0
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-green-100 text-green-800'
                                                            }`}>
                                                            {est.faltasPorMateria[materia.codigo] || 0}
                                                        </span>
                                                    </td>
                                                ))}
                                                <td className="border border-blue-200 p-3 text-center">
                                                    <span className={`inline-block px-3 py-1 rounded font-bold ${totalFaltas > 5
                                                        ? 'bg-red-200 text-red-800'
                                                        : totalFaltas > 2
                                                            ? 'bg-yellow-200 text-yellow-800'
                                                            : 'bg-green-200 text-green-800'
                                                        }`}>
                                                        {totalFaltas}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </PageContainer>
    )
}