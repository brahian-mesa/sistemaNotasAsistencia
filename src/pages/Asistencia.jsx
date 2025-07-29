import { useState, useEffect } from 'react'
import { ChevronDownIcon, ChevronUpIcon, UserGroupIcon, CalendarIcon, ChartBarIcon, UserPlusIcon } from '@heroicons/react/24/outline'
import PageContainer from '../components/PageContainer'
import * as XLSX from 'xlsx'
import db from '../utils/database'

export default function Asistencia() {
    const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0])
    const [asistencias, setAsistencias] = useState({})
    const [showEstadisticas, setShowEstadisticas] = useState(false)
    const [diasFestivos, setDiasFestivos] = useState([])

    // Definición de períodos académicos con fechas específicas
    const periodosAcademicos = {
        1: {
            nombre: 'Período 1',
            fechaInicio: '2025-01-27',
            fechaFin: '2025-04-04',
            descripcion: '27 Ene - 4 Abr'
        },
        2: {
            nombre: 'Período 2',
            fechaInicio: '2025-04-07',
            fechaFin: '2025-06-16',
            descripcion: '7 Abr - 16 Jun'
        },
        3: {
            nombre: 'Período 3',
            fechaInicio: '2025-07-07',
            fechaFin: '2025-09-12',
            descripcion: '7 Jul - 12 Sep'
        },
        4: {
            nombre: 'Período 4',
            fechaInicio: '2025-09-15',
            fechaFin: '2025-11-28',
            descripcion: '15 Sep - 28 Nov'
        }
    }

    // Función para obtener el período actual basado en la fecha de hoy
    const obtenerPeriodoActual = () => {
        const hoy = new Date()
        const fechaHoy = hoy.toISOString().split('T')[0] // Formato YYYY-MM-DD

        for (let periodo = 1; periodo <= 4; periodo++) {
            const { fechaInicio, fechaFin } = periodosAcademicos[periodo]
            if (fechaHoy >= fechaInicio && fechaHoy <= fechaFin) {
                return periodo
            }
        }

        // Si no está en ningún período, determinar el más cercano
        for (let periodo = 1; periodo <= 4; periodo++) {
            const { fechaInicio } = periodosAcademicos[periodo]
            if (fechaHoy < fechaInicio) {
                return periodo
            }
        }

        return 1 // Por defecto, período 1
    }

    // Estado para período seleccionado (inicializar con período actual)
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState(() => obtenerPeriodoActual())

    // Cargar datos desde la base de datos - igual que en Materias
    const [materias, setMaterias] = useState([])
    const [estudiantes, setEstudiantes] = useState([])

    // Estados para modal de agregar estudiante
    const [showAddStudentModal, setShowAddStudentModal] = useState(false)
    const [studentForm, setStudentForm] = useState({
        nombre: '',
        codigo: ''
    })

    // Estados para indicador de guardado automático
    const [autoSaveStatus, setAutoSaveStatus] = useState('')

    // Función para mostrar estado de guardado
    const mostrarEstadoGuardado = (mensaje) => {
        setAutoSaveStatus(mensaje)
        setTimeout(() => setAutoSaveStatus(''), 2000)
    }

    // Función para filtrar asistencias por período académico
    const filtrarAsistenciasPorPeriodo = (asistencias, periodo) => {
        const { fechaInicio, fechaFin } = periodosAcademicos[periodo]
        return asistencias.filter(asistencia =>
            asistencia.fecha >= fechaInicio && asistencia.fecha <= fechaFin
        )
    }

    // Función para generar el siguiente código disponible (igual que en Materias)
    const generarSiguienteCodigo = (codigoBase) => {
        // Extraer la parte base (letras + números) del código
        const match = codigoBase.match(/^([A-Za-z]+\d+)(\d*)$/)
        if (!match) return codigoBase

        const base = match[1] // ej: "5B01"
        let numeroActual = parseInt(match[2] || "1") // ej: "1" del "5B011"

        // Obtener todos los códigos existentes que empiecen con la misma base
        const codigosExistentes = estudiantes
            .map(est => est.codigo)
            .filter(codigo => codigo.startsWith(base))
            .map(codigo => {
                const numMatch = codigo.match(new RegExp(`^${base}(\\d+)$`))
                return numMatch ? parseInt(numMatch[1]) : 0
            })
            .sort((a, b) => a - b)

        // Encontrar el primer número disponible
        let siguienteNumero = 1
        for (const num of codigosExistentes) {
            if (num === siguienteNumero) {
                siguienteNumero++
            } else {
                break
            }
        }

        return `${base}${siguienteNumero.toString().padStart(match[2]?.length || 1, '0')}`
    }

    // Función para agregar estudiante (igual que en Materias)
    const handleAddStudent = () => {
        if (!studentForm.nombre.trim() || !studentForm.codigo.trim()) return

        try {
            let codigoFinal = studentForm.codigo.trim()

            // Verificar si el código ya existe
            const codigoExiste = estudiantes.some(est => est.codigo === codigoFinal)
            if (codigoExiste) {
                // Generar automáticamente el siguiente código disponible
                codigoFinal = generarSiguienteCodigo(codigoFinal)
                mostrarEstadoGuardado(`📝 Código actualizado automáticamente: ${codigoFinal}`)
            }

            const nuevoEstudiante = {
                nombre: studentForm.nombre.trim(),
                codigo: codigoFinal
            }

            const estudianteGuardado = db.guardarEstudiante(nuevoEstudiante)
            setEstudiantes(prev => [...prev, estudianteGuardado].sort((a, b) => a.codigo.localeCompare(b.codigo)))
            setStudentForm({ nombre: '', codigo: '' })
            setShowAddStudentModal(false)
            console.log('✅ Estudiante agregado:', estudianteGuardado)
            mostrarEstadoGuardado(`✅ Estudiante agregado: ${estudianteGuardado.codigo}`)
        } catch (error) {
            console.error('❌ Error agregando estudiante:', error)
            alert('Error al agregar el estudiante')
        }
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
            // Ordenar estudiantes por código automáticamente
            setEstudiantes(estudiantesDB.sort((a, b) => a.codigo.localeCompare(b.codigo)))

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

    // Calcular estadísticas de faltas por período
    const calcularEstadisticasFaltas = () => {
        try {
            const todasAsistencias = JSON.parse(localStorage.getItem('sistema_escolar_asistencias') || '[]')
            // Filtrar asistencias por período seleccionado
            const asistenciasDelPeriodo = filtrarAsistenciasPorPeriodo(todasAsistencias, periodoSeleccionado)
            const estadisticas = []

            estudiantes.forEach(estudiante => {
                const faltasPorMateria = {}

                // Inicializar contadores
                materias.forEach(materia => {
                    faltasPorMateria[materia.codigo] = 0
                })

                // Contar faltas - UNA por día, no por materia - SOLO del período seleccionado
                const fechasConFaltas = new Set()
                asistenciasDelPeriodo.forEach(asistencia => {
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
                    faltasPorMateria: faltasPorMateria,
                    totalFaltas: fechasConFaltas.size
                })
            })

            return estadisticas
        } catch (error) {
            console.error('❌ Error calculando estadísticas:', error)
            return []
        }
    }

    // Exportar a Excel con asistencias del período seleccionado
    const exportarAsistenciaExcel = () => {
        try {
            // Obtener todas las asistencias y filtrar por período
            const todasAsistencias = JSON.parse(localStorage.getItem('sistema_escolar_asistencias') || '[]')
            const asistenciasDelPeriodo = filtrarAsistenciasPorPeriodo(todasAsistencias, periodoSeleccionado)

            if (asistenciasDelPeriodo.length === 0) {
                alert(`⚠️ No hay asistencias guardadas para el ${periodosAcademicos[periodoSeleccionado].nombre}.`)
                return
            }

            // Obtener todas las fechas únicas del período
            const fechasUnicas = [...new Set(asistenciasDelPeriodo.map(a => a.fecha))].sort()

            // Convertir asistencias a formato fácil de usar
            const asistenciasFormateadas = {}
            asistenciasDelPeriodo.forEach(asistencia => {
                const clave = `${asistencia.fecha}-${asistencia.estudiante_id}`
                asistenciasFormateadas[clave] = asistencia.estado
            })

            // Información del período seleccionado
            const periodoInfo = periodosAcademicos[periodoSeleccionado]

            // Encabezado institucional
            const datosHoja = []
            datosHoja.push(['🏫', 'Institución Educativa Nuestra Señora De los Dolores'])
            datosHoja.push(['', `REGISTRO DE ASISTENCIA - ${periodoInfo.nombre.toUpperCase()}`])
            datosHoja.push(['', 'Sede Salvador Duque, grado 5B'])
            datosHoja.push(['', `Período académico: ${periodoInfo.descripcion}`])
            datosHoja.push(['', `Fechas del período: ${periodoInfo.fechaInicio} al ${periodoInfo.fechaFin}`])
            datosHoja.push(['', `Días con registro: ${fechasUnicas.length}`])
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

            XLSX.utils.book_append_sheet(wb, ws, `Asistencia ${periodoInfo.nombre}`)

            // Nombre del archivo
            const nombreArchivo = `asistencia_${periodoInfo.nombre.toLowerCase().replace(' ', '_')}_${periodoInfo.fechaInicio}_${periodoInfo.fechaFin}.xlsx`

            XLSX.writeFile(wb, nombreArchivo)

            alert(`✅ EXCEL EXPORTADO EXITOSAMENTE!\n\n📊 Resumen del ${periodoInfo.nombre}:\n• ${fechasUnicas.length} días con registro\n• ${asistenciasDelPeriodo.length} registros del período\n• Período: ${periodoInfo.descripcion}\n\n💾 Archivo: ${nombreArchivo}`)

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

    const [estadisticas, setEstadisticas] = useState([])

    // Recalcular estadísticas cuando cambie el período seleccionado
    useEffect(() => {
        const nuevasEstadisticas = calcularEstadisticasFaltas()
        setEstadisticas(nuevasEstadisticas)
    }, [periodoSeleccionado, estudiantes, materias])

    return (
        <PageContainer title="Control de Asistencia - Grado 5B" subtitle="Registro diario de asistencia">
            <div className="space-y-6 p-4 md:p-6 min-h-screen pb-6">

                {/* Indicador de guardado automático */}
                {autoSaveStatus && (
                    <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-lg shadow-lg">
                        {autoSaveStatus}
                    </div>
                )}

                {/* Selector de fecha y período */}
                <div className="bg-white/95 p-4 md:p-6 rounded-xl shadow-lg border border-white/40 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <CalendarIcon className="h-8 w-8 text-purple-600 mr-3" />
                            <h2 className="text-xl md:text-2xl font-bold text-purple-800">
                                Seleccionar Fecha y Período
                            </h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <label className="text-purple-700 font-medium">Fecha:</label>
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
                        <div className="flex items-center gap-2">
                            <label className="text-purple-700 font-medium">Período Académico:</label>
                            <select
                                value={periodoSeleccionado}
                                onChange={(e) => setPeriodoSeleccionado(parseInt(e.target.value))}
                                className="px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                            >
                                {Object.entries(periodosAcademicos).map(([num, periodo]) => (
                                    <option key={num} value={num}>
                                        {periodo.nombre} ({periodo.descripcion})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-700">
                            <strong>Período seleccionado:</strong> {periodosAcademicos[periodoSeleccionado].nombre}
                            <span className="ml-2">del {periodosAcademicos[periodoSeleccionado].fechaInicio} al {periodosAcademicos[periodoSeleccionado].fechaFin}</span>
                        </p>
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
                            <button
                                onClick={() => setShowAddStudentModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                <UserPlusIcon className="h-5 w-5" />
                                Agregar Estudiante
                            </button>
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
                                <div>
                                    <h2 className="text-xl md:text-2xl font-bold text-blue-800">
                                        Estadísticas de Faltas por Materia
                                    </h2>
                                    <p className="text-sm text-blue-600 mt-1">
                                        {periodosAcademicos[periodoSeleccionado].nombre} ({periodosAcademicos[periodoSeleccionado].descripcion})
                                    </p>
                                </div>
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

                {/* Modal Agregar Estudiante */}
                {showAddStudentModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Agregar Nuevo Estudiante</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre del estudiante
                                    </label>
                                    <input
                                        type="text"
                                        value={studentForm.nombre}
                                        onChange={(e) => setStudentForm(prev => ({ ...prev, nombre: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="Ej: María González"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Código del estudiante
                                    </label>
                                    <input
                                        type="text"
                                        value={studentForm.codigo}
                                        onChange={(e) => setStudentForm(prev => ({ ...prev, codigo: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="Ej: 5B011"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowAddStudentModal(false)
                                        setStudentForm({ nombre: '', codigo: '' })
                                    }}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddStudent}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                                >
                                    Agregar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageContainer>
    )
}