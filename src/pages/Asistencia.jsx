import { CalendarIcon, ChartBarIcon, ChevronUpIcon, UserGroupIcon, UserPlusIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import PageContainer from '../components/PageContainer'
import auth from '../utils/auth'
import db from '../utils/database'
import supabase from '../utils/supabase'

export default function Asistencia() {
    const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0])
    const [asistencias, setAsistencias] = useState({})
    const [showEstadisticas, setShowEstadisticas] = useState(false)
    const [diasFestivos, setDiasFestivos] = useState([])

    // Obtener períodos académicos de la base de datos
    const [periodosAcademicos, setPeriodosAcademicos] = useState({})


    // Formatear períodos para mostrar - valores por defecto
    const periodosFormateados = {
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

        // Usar periodosFormateados como fallback
        const periodos = Object.keys(periodosAcademicos).length > 0 ? periodosAcademicos : periodosFormateados

        for (let periodo = 1; periodo <= 4; periodo++) {
            const periodoData = periodos[periodo]
            if (periodoData && fechaHoy >= periodoData.fechaInicio && fechaHoy <= periodoData.fechaFin) {
                return periodo
            }
        }

        // Si no está en ningún período, determinar el más cercano
        for (let periodo = 1; periodo <= 4; periodo++) {
            const periodoData = periodos[periodo]
            if (periodoData && fechaHoy < periodoData.fechaInicio) {
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
    const [actualizandoEstadisticas, setActualizandoEstadisticas] = useState(false)

    // Función para mostrar estado de guardado
    const mostrarEstadoGuardado = (mensaje) => {
        setAutoSaveStatus(mensaje)
        setTimeout(() => setAutoSaveStatus(''), 2000)
    }

    // Función para filtrar asistencias por período académico
    const filtrarAsistenciasPorPeriodo = (asistencias, periodo) => {
        const periodos = Object.keys(periodosAcademicos).length > 0 ? periodosAcademicos : periodosFormateados
        const periodoData = periodos[periodo]

        if (!periodoData) {
            return asistencias // Si no hay datos del período, devolver todas las asistencias
        }

        return asistencias.filter(asistencia =>
            asistencia.fecha >= periodoData.fechaInicio && asistencia.fecha <= periodoData.fechaFin
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
    const handleAddStudent = async () => {
        if (!studentForm.nombre.trim() || !studentForm.codigo.trim()) {
            mostrarEstadoGuardado('❌ Por favor completa todos los campos')
            return
        }

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
                codigo: codigoFinal,
                grado: auth.getCurrentUser()?.grado || 'Sin especificar'
            }

            const estudianteGuardado = await db.guardarEstudiante(nuevoEstudiante)

            // Actualizar lista local
            setEstudiantes(prev => [...prev, estudianteGuardado].sort((a, b) => {
                const codigoA = parseInt(a.codigo) || 0;
                const codigoB = parseInt(b.codigo) || 0;
                return codigoA - codigoB;
            }))
            setStudentForm({ nombre: '', codigo: '' })
            setShowAddStudentModal(false)

            mostrarEstadoGuardado(`✅ Estudiante agregado: ${estudianteGuardado.codigo}`)
        } catch (error) {
            mostrarEstadoGuardado(`❌ Error al agregar estudiante: ${error.message}`)
        }
    }

    // Cargar datos al inicializar - igual que en Materias
    useEffect(() => {
        cargarDatos()
        cargarPeriodosAcademicos()
    }, [])

    const cargarPeriodosAcademicos = async () => {
        try {
            const periodos = await db.getPeriodosAcademicos()
            setPeriodosAcademicos(periodos)
        } catch (error) {

        }
    }

    const cargarDatos = async () => {
        try {
            const currentUser = auth.getCurrentUser()

            if (!currentUser) {
                console.error('❌ No hay usuario autenticado')
                mostrarEstadoGuardado('❌ No hay usuario autenticado')
                return
            }


            // Cargar datos en paralelo para mejor rendimiento
            const [materiasDB, estudiantesDB] = await Promise.all([
                db.getMaterias(),
                db.getEstudiantes()
            ])

            // Las materias ya vienen filtradas por usuario_id desde database.js
            const materiasUsuario = materiasDB || []

            // Los estudiantes ya vienen filtradas por usuario_id desde database.js
            const estudiantesUsuario = estudiantesDB || []

            setMaterias(materiasUsuario)
            // Ordenar estudiantes por código automáticamente
            setEstudiantes(estudiantesUsuario.sort((a, b) => {
                const codigoA = parseInt(a.codigo) || 0;
                const codigoB = parseInt(b.codigo) || 0;
                return codigoA - codigoB;
            }))






        } catch (error) {
            mostrarEstadoGuardado(`❌ Error cargando datos: ${error.message}`)
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

    // Obtener asistencias desde Supabase
    useEffect(() => {
        const cargarAsistenciasFecha = async () => {
            try {
                const asistenciasDB = await db.getAsistencia(fechaSeleccionada)

                // Convertir a formato del estado local para la fecha seleccionada
                const asistenciasFormateadas = {}

                // Agrupar por estudiante (tomar el primer estado encontrado para cada estudiante)
                const asistenciasPorEstudiante = {}
                asistenciasDB.forEach(asistencia => {
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
            } catch (error) {
                mostrarEstadoGuardado(`❌ Error cargando asistencias: ${error.message}`)
            }
        }

        cargarAsistenciasFecha()
    }, [fechaSeleccionada])

    // Manejar cambio de asistencia - guardado automático en Supabase
    const manejarAsistencia = async (estudianteId, estado) => {
        const clave = `${fechaSeleccionada}-${estudianteId}`

        // Validar datos antes de procesar
        if (!estudianteId || !estado || !fechaSeleccionada) {
            console.error('❌ Datos inválidos para asistencia:', { estudianteId, estado, fechaSeleccionada })
            mostrarEstadoGuardado('❌ Error: Datos inválidos')
            return
        }

        // Validar que hay materias programadas para el día
        if (materiasDelDia.length === 0) {
            console.error('❌ No hay materias programadas para este día')
            mostrarEstadoGuardado('❌ No hay materias programadas')
            return
        }

        // Actualizar estado local primero para respuesta inmediata
        setAsistencias(prev => ({
            ...prev,
            [clave]: {
                estudianteId: parseInt(estudianteId),
                fecha: fechaSeleccionada,
                estado: estado
            }
        }))

        // Guardar automáticamente en Supabase usando el método individual más eficiente
        try {
            // Guardar asistencia para cada materia del día usando el método individual
            const promesasGuardado = materiasDelDia.map(materia =>
                db.guardarAsistenciaIndividual(
                    parseInt(estudianteId),
                    materia.id,
                    fechaSeleccionada,
                    estado
                )
            );

            // Esperar a que todas las asistencias se guarden
            await Promise.all(promesasGuardado);

            const estadoTexto = estado === 'presente' ? '✅ Presente' : '❌ Ausente'
            mostrarEstadoGuardado(`${estadoTexto} - Guardado correctamente`)

            // Actualizar estadísticas inmediatamente después de guardar
            await actualizarEstadisticasAutomatico()

        } catch (error) {
            mostrarEstadoGuardado(`❌ Error al guardar: ${error.message}`)

            // Revertir cambio local si hay error
            setAsistencias(prev => {
                const newAsistencias = { ...prev }
                delete newAsistencias[clave]
                return newAsistencias
            })
        }
    }

    // Obtener estado de asistencia
    const obtenerAsistencia = (estudianteId) => {
        const clave = `${fechaSeleccionada}-${estudianteId}`
        return asistencias[clave]?.estado || ''
    }

    // Calcular estadísticas de faltas por período - MÉTODO MEJORADO
    const calcularEstadisticasFaltas = async () => {
        try {
            const periodoInfo = periodosAcademicos[periodoSeleccionado] || periodosFormateados[periodoSeleccionado]


            // Obtener TODAS las asistencias del período usando paginación
            let asistenciasDB = []
            let desde = 0
            const limite = 1000
            let hayMasRegistros = true

            console.log('🔄 Cargando asistencias para estadísticas con paginación...')

            while (hayMasRegistros) {
                const { data, error, count } = await supabase
                    .from('asistencias')
                    .select('*', { count: 'exact' })
                    .gte('fecha', periodoInfo.fechaInicio)
                    .lte('fecha', periodoInfo.fechaFin)
                    .eq('usuario_id', auth.getCurrentUser()?.id)
                    .order('fecha', { ascending: true })
                    .range(desde, desde + limite - 1);

                if (error) {
                    console.error('❌ Error obteniendo asistencias para estadísticas:', error);
                    return [];
                }

                if (data && data.length > 0) {
                    asistenciasDB = [...asistenciasDB, ...data]
                    console.log(`📦 Estadísticas: Descargados ${data.length} registros (total: ${asistenciasDB.length}/${count})`)

                    if (data.length < limite) {
                        hayMasRegistros = false
                    } else {
                        desde += limite
                    }
                } else {
                    hayMasRegistros = false
                }
            }

            console.log('📊 Estadísticas: Total de registros obtenidos:', asistenciasDB.length);


            const estadisticas = []

            estudiantes.forEach(estudiante => {
                const faltasPorMateria = {}
                const asistenciasPorMateria = {}

                // Inicializar contadores para todas las materias
                materias.forEach(materia => {
                    faltasPorMateria[materia.codigo] = 0
                    asistenciasPorMateria[materia.codigo] = 0
                })

                // Procesar cada asistencia del estudiante
                asistenciasDB.forEach(asistencia => {
                    if (asistencia.estudiante_id === estudiante.id) {
                        const materia = materias.find(m => m.id === asistencia.materia_id)
                        if (materia) {
                            asistenciasPorMateria[materia.codigo]++
                            if (asistencia.estado === 'ausente') {
                                faltasPorMateria[materia.codigo]++
                            }
                        }
                    }
                })

                // Calcular total de faltas (suma de todas las materias)
                const totalFaltas = Object.values(faltasPorMateria).reduce((sum, faltas) => sum + faltas, 0)
                const totalAsistencias = Object.values(asistenciasPorMateria).reduce((sum, asistencias) => sum + asistencias, 0)


                estadisticas.push({
                    estudiante: estudiante.nombre,
                    codigoEstudiante: estudiante.codigo,
                    faltasPorMateria: faltasPorMateria,
                    asistenciasPorMateria: asistenciasPorMateria,
                    totalFaltas: totalFaltas,
                    totalAsistencias: totalAsistencias
                })
            })

            return estadisticas
        } catch (error) {
            console.error('❌ Error calculando estadísticas:', error)
            return []
        }
    }

    // Exportar estadísticas a Excel - MEJORADO CON LOGS
    const exportarEstadisticasExcel = async () => {
        console.log('📊 Iniciando exportación de estadísticas...')
        console.log('📊 Estadísticas disponibles:', estadisticas.length)

        if (!estadisticas || estadisticas.length === 0) {
            alert('⚠️ No hay estadísticas para exportar. Primero marca algunas asistencias.')
            return
        }

        try {
            const periodoInfoExport = periodosAcademicos[periodoSeleccionado] || periodosFormateados[periodoSeleccionado]
            const currentUser = auth.getCurrentUser()
            const wb = XLSX.utils.book_new()

            console.log('📅 Período a exportar:', periodoInfoExport?.nombre || `Período ${periodoSeleccionado}`)
            console.log('👥 Total de estudiantes:', estadisticas.length)
            console.log('📚 Total de materias:', materias.length)

            // Calcular totales generales
            const totalFaltasGeneral = estadisticas.reduce((sum, est) => sum + est.totalFaltas, 0)
            const totalAsistenciasGeneral = estadisticas.reduce((sum, est) => sum + est.totalAsistencias, 0)

            // Crear datos del reporte
            const datosHoja = [
                ['INSTITUCIÓN EDUCATIVA NUESTRA SEÑORA DE LOS DOLORES'],
                ['REPORTE DE ESTADÍSTICAS DE FALTAS POR MATERIA'],
                [`Grado: ${currentUser?.grado || '5B'}`],
                [`Docente: ${currentUser?.nombre || 'Sin especificar'}`],
                [],
                ['INFORMACIÓN DEL PERÍODO'],
                ['Período Académico:', `${periodoInfoExport?.nombre || `Período ${periodoSeleccionado}`}`],
                ['Fechas:', `${periodoInfoExport?.fechaInicio || 'N/A'} al ${periodoInfoExport?.fechaFin || 'N/A'}`],
                ['Fecha de reporte:', new Date().toLocaleDateString('es-ES')],
                [],
                ['RESUMEN GENERAL'],
                ['Total de estudiantes:', estadisticas.length],
                ['Total de faltas en el período:', totalFaltasGeneral],
                ['Total de asistencias registradas:', totalAsistenciasGeneral],
                ['Porcentaje de faltas:', totalAsistenciasGeneral > 0 ? `${((totalFaltasGeneral / totalAsistenciasGeneral) * 100).toFixed(1)}%` : '0%'],
                [],
                ['DETALLE POR ESTUDIANTE Y MATERIA']
            ]

            // Encabezados de la tabla
            const encabezados = ['Código', 'Estudiante']
            materias.forEach(materia => {
                encabezados.push(materia.nombre)
            })
            encabezados.push('Total Faltas', 'Total Asistencias', '% Faltas')
            datosHoja.push(encabezados)

            // Datos de estudiantes
            estadisticas.forEach(est => {
                const filaEstudiante = [est.codigoEstudiante, est.estudiante]

                // Agregar faltas por cada materia
                materias.forEach(materia => {
                    filaEstudiante.push(est.faltasPorMateria[materia.codigo] || 0)
                })

                // Totales del estudiante
                filaEstudiante.push(est.totalFaltas)
                filaEstudiante.push(est.totalAsistencias)

                // Porcentaje de faltas del estudiante
                const porcentajeFaltas = est.totalAsistencias > 0 ?
                    ((est.totalFaltas / est.totalAsistencias) * 100).toFixed(1) : '0'
                filaEstudiante.push(`${porcentajeFaltas}%`)

                datosHoja.push(filaEstudiante)
            })

            // Agregar fila de totales por materia
            const filaTotales = ['TOTALES', '']
            materias.forEach(materia => {
                const totalMateria = estadisticas.reduce((sum, est) =>
                    sum + (est.faltasPorMateria[materia.codigo] || 0), 0)
                filaTotales.push(totalMateria)
            })
            filaTotales.push(totalFaltasGeneral, totalAsistenciasGeneral, '')
            datosHoja.push(filaTotales)

            // Crear worksheet
            const ws = XLSX.utils.aoa_to_sheet(datosHoja)

            // Ajustar ancho de columnas
            const colWidths = [
                { wch: 12 }, // Código
                { wch: 30 }, // Estudiante
                ...materias.map(() => ({ wch: 15 })), // Materias
                { wch: 12 }, // Total Faltas
                { wch: 15 }, // Total Asistencias
                { wch: 10 }  // % Faltas
            ]
            ws['!cols'] = colWidths

            // Agregar hoja
            XLSX.utils.book_append_sheet(wb, ws, 'Estadísticas Faltas')

            // Nombre del archivo
            const nombrePeriodo = (periodoInfoExport?.nombre || `Período ${periodoSeleccionado}`).toLowerCase().replace(/\s+/g, '_')
            const fechaReporte = new Date().toISOString().split('T')[0]
            const nombreArchivo = `estadisticas_faltas_${nombrePeriodo}_${fechaReporte}.xlsx`

            // Descargar
            XLSX.writeFile(wb, nombreArchivo)

            console.log('✅ ¡Exportación de estadísticas completada exitosamente!')
            console.log(`📊 Archivo: ${nombreArchivo}`)
            console.log(`👥 Estudiantes: ${estadisticas.length}`)
            console.log(`📚 Materias: ${materias.length}`)
            console.log(`📋 Total de faltas: ${totalFaltasGeneral}`)
            console.log(`📋 Total de asistencias: ${totalAsistenciasGeneral}`)

            alert(`✅ ¡Exportación de estadísticas completada!\n\n` +
                  `📊 Archivo: ${nombreArchivo}\n` +
                  `👥 Estudiantes: ${estadisticas.length}\n` +
                  `📚 Materias: ${materias.length}\n` +
                  `📋 Total de faltas: ${totalFaltasGeneral}\n` +
                  `📋 Total de asistencias: ${totalAsistenciasGeneral}\n\n` +
                  `✓ El archivo se ha descargado correctamente`)

        } catch (error) {
            console.error('❌ Error completo al exportar estadísticas:', error)
            alert(`❌ Error al exportar: ${error.message}`)
        }
    }

    // Exportar a Excel con asistencias del período seleccionado - CORREGIDO CON LÍMITE EXPANDIDO
    const exportarAsistenciaExcel = async () => {
        try {

            const periodoInfoRegistro = periodosAcademicos[periodoSeleccionado] || periodosFormateados[periodoSeleccionado]
            const currentUser = auth.getCurrentUser()

            console.log('📊 Exportando asistencias del período:', periodoInfoRegistro)
            console.log('📅 Rango de fechas:', periodoInfoRegistro.fechaInicio, 'al', periodoInfoRegistro.fechaFin)

            // Obtener TODAS las asistencias del período usando paginación
            // Supabase tiene un límite de 1000 registros por defecto, así que necesitamos paginación
            let todasAsistencias = []
            let desde = 0
            const limite = 1000
            let hayMasRegistros = true

            console.log('🔄 Iniciando descarga de asistencias con paginación...')

            while (hayMasRegistros) {
                const { data, error, count } = await supabase
                    .from('asistencias')
                    .select('*', { count: 'exact' })
                    .gte('fecha', periodoInfoRegistro.fechaInicio)
                    .lte('fecha', periodoInfoRegistro.fechaFin)
                    .eq('usuario_id', currentUser?.id)
                    .order('fecha', { ascending: true })
                    .order('estudiante_id', { ascending: true })
                    .range(desde, desde + limite - 1)

                if (error) {
                    console.error('❌ Error obteniendo asistencias:', error)
                    alert(`❌ Error obteniendo datos: ${error.message}`)
                    return
                }

                if (data && data.length > 0) {
                    todasAsistencias = [...todasAsistencias, ...data]
                    console.log(`📦 Descargados ${data.length} registros (total acumulado: ${todasAsistencias.length}/${count})`)

                    // Si obtuvimos menos registros que el límite, ya no hay más
                    if (data.length < limite) {
                        hayMasRegistros = false
                    } else {
                        desde += limite
                    }
                } else {
                    hayMasRegistros = false
                }
            }

            console.log('✅ Descarga completa!')
            console.log('📊 Total de registros obtenidos:', todasAsistencias.length)

            if (!todasAsistencias || todasAsistencias.length === 0) {
                const nombrePeriodo = periodosAcademicos[periodoSeleccionado]?.nombre || `Período ${periodoSeleccionado}`
                alert(`⚠️ No hay asistencias guardadas para el ${nombrePeriodo}.\n\nPrimero marca algunas asistencias en diferentes fechas.`)
                return
            }

            console.log('🔍 Muestra de asistencias obtenidas:', todasAsistencias.slice(0, 5))

            // Obtener todas las fechas únicas del período y ordenarlas
            const fechasUnicas = [...new Set(todasAsistencias.map(a => a.fecha))].sort()
            console.log('📅 Fechas únicas encontradas:', fechasUnicas.length, 'fechas')
            console.log('📅 Primera y última fecha:', fechasUnicas[0], '-', fechasUnicas[fechasUnicas.length - 1])

            // Convertir asistencias a formato fácil de usar (agrupar por estudiante y fecha)
            // MEJORADO: Priorizar ausente si hay al menos una falta en cualquier materia ese día
            const asistenciasFormateadas = {}
            todasAsistencias.forEach(asistencia => {
                const clave = `${asistencia.fecha}-${asistencia.estudiante_id}`
                // Si ya existe una ausencia, mantenerla; si no, actualizar
                if (!asistenciasFormateadas[clave]) {
                    asistenciasFormateadas[clave] = asistencia.estado
                } else if (asistencia.estado === 'ausente') {
                    // Priorizar ausente: si hay al menos una falta, marcar como ausente
                    asistenciasFormateadas[clave] = 'ausente'
                }
            })

            console.log('📋 Total de claves de asistencia únicas:', Object.keys(asistenciasFormateadas).length)
            console.log('🔍 Muestra de asistencias formateadas:', Object.entries(asistenciasFormateadas).slice(0, 5))

            // Crear datos del reporte
            const datosHoja = [
                ['INSTITUCIÓN EDUCATIVA NUESTRA SEÑORA DE LOS DOLORES'],
                ['REGISTRO DE ASISTENCIA'],
                [`Grado: ${currentUser?.grado || '5B'}`],
                [`Docente: ${currentUser?.nombre || 'Sin especificar'}`],
                [],
                ['INFORMACIÓN DEL PERÍODO'],
                ['Período Académico:', `${periodoInfoRegistro?.nombre || `Período ${periodoSeleccionado}`}`],
                ['Fechas:', `${periodoInfoRegistro?.fechaInicio || 'N/A'} al ${periodoInfoRegistro?.fechaFin || 'N/A'}`],
                ['Fecha de reporte:', new Date().toLocaleDateString('es-ES')],
                [],
                ['LEYENDA: X = Presente, F = Falta, (vacío) = Sin registro'],
                []
            ]

            // Crear encabezados con fechas
            const encabezados = ['N°', 'CÓDIGO', 'NOMBRE DEL ESTUDIANTE']
            fechasUnicas.forEach(fecha => {
                const fechaObj = new Date(fecha + 'T12:00:00')
                const dia = fechaObj.getDate()
                const mes = fechaObj.getMonth() + 1
                encabezados.push(`${dia}/${mes}`)
            })
            encabezados.push('TOTAL FALTAS')

            datosHoja.push(encabezados)

            // Datos de estudiantes - MEJORADO CON LOGS DE DEPURACIÓN
            console.log('👥 Procesando', estudiantes.length, 'estudiantes')
            estudiantes.forEach((estudiante, index) => {
                const filaEstudiante = [index + 1, estudiante.codigo, estudiante.nombre]
                let totalFaltas = 0
                let presentes = 0
                let sinRegistro = 0

                fechasUnicas.forEach(fecha => {
                    const claveAsistencia = `${fecha}-${estudiante.id}`
                    const estadoAsistencia = asistenciasFormateadas[claveAsistencia]

                    if (estadoAsistencia === 'presente') {
                        filaEstudiante.push('X') // Presente
                        presentes++
                    } else if (estadoAsistencia === 'ausente') {
                        filaEstudiante.push('F') // Falta
                        totalFaltas++
                    } else {
                        filaEstudiante.push('') // Sin registro
                        sinRegistro++
                    }
                })

                filaEstudiante.push(totalFaltas)
                datosHoja.push(filaEstudiante)

                // Log para el primer estudiante como muestra
                if (index === 0) {
                    console.log('📊 Estudiante muestra:', estudiante.nombre)
                    console.log('  - Presentes:', presentes)
                    console.log('  - Faltas:', totalFaltas)
                    console.log('  - Sin registro:', sinRegistro)
                    console.log('  - Total fechas procesadas:', fechasUnicas.length)
                }
            })

            console.log('✅ Total de filas de datos generadas:', estudiantes.length)

            // Crear workbook y worksheet
            const wb = XLSX.utils.book_new()
            const ws = XLSX.utils.aoa_to_sheet(datosHoja)

            // Ajustar ancho de columnas
            const colWidths = [
                { wch: 5 },  // N°
                { wch: 12 }, // Código
                { wch: 35 }, // Nombre
                ...fechasUnicas.map(() => ({ wch: 8 })), // Fechas
                { wch: 12 }  // Total
            ]
            ws['!cols'] = colWidths

            XLSX.utils.book_append_sheet(wb, ws, 'Registro Asistencia')

            // Nombre del archivo
            const nombrePeriodo = (periodoInfoRegistro?.nombre || `período_${periodoSeleccionado}`).toLowerCase().replace(/\s+/g, '_')
            const fechaReporte = new Date().toISOString().split('T')[0]
            const nombreArchivo = `registro_asistencia_${nombrePeriodo}_${fechaReporte}.xlsx`

            // Descargar archivo
            XLSX.writeFile(wb, nombreArchivo)

            // Mensaje de éxito con información detallada
            const totalRegistros = todasAsistencias.length
            const totalEstudiantes = estudiantes.length
            const totalFechas = fechasUnicas.length

            console.log('✅ ¡Exportación completada exitosamente!')
            console.log(`📊 Archivo: ${nombreArchivo}`)
            console.log(`👥 Estudiantes: ${totalEstudiantes}`)
            console.log(`📅 Fechas: ${totalFechas}`)
            console.log(`📋 Registros totales: ${totalRegistros}`)

            alert(`✅ ¡Exportación completada!\n\n` +
                  `📊 Archivo: ${nombreArchivo}\n` +
                  `👥 Estudiantes: ${totalEstudiantes}\n` +
                  `📅 Fechas registradas: ${totalFechas}\n` +
                  `📋 Total de asistencias: ${totalRegistros}\n\n` +
                  `✓ El archivo se ha descargado correctamente`)

        } catch (error) {
            console.error('❌ Error completo:', error)
            alert(`❌ Error al exportar archivo Excel: ${error.message}`)
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

    // Función para actualizar estadísticas manualmente
    const actualizarEstadisticasManual = async () => {
        try {
            setActualizandoEstadisticas(true);
            const nuevasEstadisticas = await calcularEstadisticasFaltas()
            setEstadisticas(nuevasEstadisticas)

            // Mostrar resumen de estadísticas actualizadas
            const totalFaltas = nuevasEstadisticas.reduce((sum, est) => sum + est.totalFaltas, 0);
            const totalAsistencias = nuevasEstadisticas.reduce((sum, est) => sum + est.totalAsistencias, 0);
            mostrarEstadoGuardado(`📊 Stats actualizadas: ${totalFaltas} faltas de ${totalAsistencias} registros`);

            return nuevasEstadisticas;
        } catch (error) {
            console.error('❌ Error actualizando estadísticas:', error);
            mostrarEstadoGuardado('❌ Error actualizando estadísticas');
            return [];
        } finally {
            setActualizandoEstadisticas(false);
        }
    }

    // Función para actualizar estadísticas automáticamente (sin mostrar loading)
    const actualizarEstadisticasAutomatico = async () => {
        try {
            const nuevasEstadisticas = await calcularEstadisticasFaltas()
            setEstadisticas(nuevasEstadisticas)
            return nuevasEstadisticas;
        } catch (error) {
            console.error('❌ Error actualizando estadísticas automáticamente:', error);
            return [];
        }
    }

    // Recalcular estadísticas cuando cambie el período seleccionado, estudiantes, materias o asistencias
    useEffect(() => {
        const actualizarEstadisticas = async () => {
            const nuevasEstadisticas = await calcularEstadisticasFaltas()
            setEstadisticas(nuevasEstadisticas)
        }

        // Solo recalcular si tenemos datos necesarios
        if (estudiantes.length > 0 && materias.length > 0) {
            actualizarEstadisticas()
        }
    }, [periodoSeleccionado, estudiantes, materias])

    // Recalcular estadísticas cuando cambien las asistencias (para actualización automática)
    useEffect(() => {
        const actualizarEstadisticasPorAsistencias = async () => {
            if (estudiantes.length > 0 && materias.length > 0 && estadisticas.length > 0) {
                const nuevasEstadisticas = await calcularEstadisticasFaltas()
                setEstadisticas(nuevasEstadisticas)
            }
        }

        // Usar un pequeño delay para evitar recálculos excesivos
        const timeoutId = setTimeout(actualizarEstadisticasPorAsistencias, 500)
        return () => clearTimeout(timeoutId)
    }, [asistencias])

    return (
        <PageContainer title={`Control de Asistencia - Grado ${auth.getCurrentUser()?.grado || '5B'}`} subtitle="Registro diario de asistencia">
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
                                {Object.keys(periodosAcademicos).length > 0 ? (
                                    Object.entries(periodosAcademicos).map(([num, periodo]) => (
                                        <option key={num} value={num}>
                                            {periodo.nombre} ({periodo.fechaInicio} al {periodo.fechaFin})
                                        </option>
                                    ))
                                ) : (
                                    <>
                                        <option value={1}>Período 1 (2025-01-27 al 2025-04-04)</option>
                                        <option value={2}>Período 2 (2025-04-07 al 2025-06-16)</option>
                                        <option value={3}>Período 3 (2025-07-07 al 2025-09-12)</option>
                                        <option value={4}>Período 4 (2025-09-15 al 2025-11-28)</option>
                                    </>
                                )}
                            </select>
                            <button
                                onClick={() => {
                                    const fechaHoy = new Date().toISOString().split('T')[0]
                                    let periodoActual = 4

                                    if (fechaHoy >= '2025-01-27' && fechaHoy <= '2025-04-04') periodoActual = 1
                                    else if (fechaHoy >= '2025-04-07' && fechaHoy <= '2025-06-16') periodoActual = 2
                                    else if (fechaHoy >= '2025-07-07' && fechaHoy <= '2025-09-12') periodoActual = 3
                                    else if (fechaHoy >= '2025-09-15' && fechaHoy <= '2025-11-28') periodoActual = 4

                                    setPeriodoSeleccionado(periodoActual)
                                    setFechaSeleccionada(fechaHoy)
                                    mostrarEstadoGuardado(`📅 Período actual: ${periodoActual}`)
                                }}
                                className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm"
                                title="Ir al período actual"
                            >
                                🎯 Hoy
                            </button>
                        </div>
                    </div>
                    <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-700">
                            <strong>Período seleccionado:</strong> {
                                periodosAcademicos[periodoSeleccionado]?.nombre ||
                                `Período ${periodoSeleccionado}`
                            }
                            <span className="ml-2">del {
                                periodosAcademicos[periodoSeleccionado]?.fechaInicio ||
                                periodosFormateados[periodoSeleccionado]?.fechaInicio
                            } al {
                                    periodosAcademicos[periodoSeleccionado]?.fechaFin ||
                                    periodosFormateados[periodoSeleccionado]?.fechaFin
                                }</span>
                        </p>
                        {Object.keys(periodosAcademicos).length === 0 && (
                            <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded">
                                <p className="text-xs text-yellow-700">
                                    ⚠️ No hay períodos académicos configurados.
                                    <button
                                        onClick={async () => {
                                            try {
                                                await db.guardarPeriodosAcademicos(periodosFormateados)
                                                window.location.reload()
                                            } catch (error) {
                                                alert('Error al inicializar períodos')
                                            }
                                        }}
                                        className="ml-1 text-yellow-800 underline hover:text-yellow-900"
                                    >
                                        Inicializar períodos por defecto
                                    </button>
                                </p>
                            </div>
                        )}
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
                            <div className="mt-2 flex gap-4 text-sm">
                                <span className="text-green-600">
                                    ✅ Presentes: {estudiantes.filter(est => obtenerAsistencia(est.id) === 'presente').length}
                                </span>
                                <span className="text-red-600">
                                    ❌ Ausentes: {estudiantes.filter(est => obtenerAsistencia(est.id) === 'ausente').length}
                                </span>
                            </div>
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
                {showEstadisticas && (
                    actualizandoEstadisticas ? (
                        <div className="bg-white/95 p-4 md:p-6 rounded-xl shadow-lg border border-white/40 backdrop-blur-sm">
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Actualizando estadísticas...</h3>
                                    <p className="text-gray-500">Calculando faltas por materia</p>
                                </div>
                            </div>
                        </div>
                    ) : estadisticas.length > 0 ? (
                        <div className="bg-white/95 p-4 md:p-6 rounded-xl shadow-lg border border-white/40 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    <ChartBarIcon className="h-8 w-8 text-blue-600 mr-3" />
                                    <div>
                                        <h2 className="text-xl md:text-2xl font-bold text-blue-800">
                                            Estadísticas de Faltas por Materia
                                        </h2>
                                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-sm text-blue-700">
                                                <span className="font-semibold">📅 Período Académico:</span> {
                                                    periodosAcademicos[periodoSeleccionado]?.nombre ||
                                                    `Período ${periodoSeleccionado}`
                                                }
                                            </p>
                                            <p className="text-sm text-blue-600 mt-1">
                                                <span className="font-medium">📆 Fechas:</span> {
                                                    periodosAcademicos[periodoSeleccionado]?.fechaInicio ||
                                                    periodosFormateados[periodoSeleccionado]?.fechaInicio
                                                } al {
                                                    periodosAcademicos[periodoSeleccionado]?.fechaFin ||
                                                    periodosFormateados[periodoSeleccionado]?.fechaFin
                                                }
                                            </p>
                                            <p className="text-xs text-blue-500 mt-1">
                                                {periodosAcademicos[periodoSeleccionado]?.descripcion || periodosFormateados[periodoSeleccionado]?.descripcion}
                                            </p>
                                        </div>

                                        {/* Resumen de estadísticas */}
                                        {estadisticas.length > 0 && (
                                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div className="text-center">
                                                        <div className="text-lg font-bold text-green-800">
                                                            {estadisticas.length}
                                                        </div>
                                                        <div className="text-green-600">Estudiantes</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-lg font-bold text-red-800">
                                                            {estadisticas.reduce((sum, est) => sum + est.totalFaltas, 0)}
                                                        </div>
                                                        <div className="text-red-600">Faltas Totales</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-lg font-bold text-blue-800">
                                                            {estadisticas.reduce((sum, est) => sum + est.totalAsistencias, 0)}
                                                        </div>
                                                        <div className="text-blue-600">Asistencias</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-lg font-bold text-purple-800">
                                                            {(() => {
                                                                const totalFaltas = estadisticas.reduce((sum, est) => sum + est.totalFaltas, 0)
                                                                const totalAsistencias = estadisticas.reduce((sum, est) => sum + est.totalAsistencias, 0)
                                                                return totalAsistencias > 0 ? `${((totalFaltas / totalAsistencias) * 100).toFixed(1)}%` : '0%'
                                                            })()}
                                                        </div>
                                                        <div className="text-purple-600">% Faltas</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={exportarEstadisticasExcel}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        Exportar Excel
                                    </button>
                                    <button
                                        onClick={() => setShowEstadisticas(false)}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        <ChevronUpIcon className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-auto max-h-[500px] border border-blue-200 rounded-lg">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-blue-50">
                                            <th className="border border-blue-200 p-3 text-left text-blue-800 font-bold">Código</th>
                                            <th className="border border-blue-200 p-3 text-left text-blue-800 font-bold">Estudiante</th>
                                            {materias.map(materia => (
                                                <th key={materia.codigo} className="border border-blue-200 p-3 text-center text-blue-800 font-bold">
                                                    <div className="text-xs">{materia.nombre}</div>
                                                    <div className="text-xs text-blue-600 mt-1">Faltas</div>
                                                </th>
                                            ))}
                                            <th className="border border-blue-200 p-3 text-center text-blue-800 font-bold">
                                                <div className="text-xs">Total</div>
                                                <div className="text-xs text-blue-600 mt-1">Faltas</div>
                                            </th>
                                            <th className="border border-blue-200 p-3 text-center text-blue-800 font-bold">
                                                <div className="text-xs">Total</div>
                                                <div className="text-xs text-blue-600 mt-1">Registros</div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {estadisticas.map((est, index) => {
                                            const totalFaltas = est.totalFaltas || 0
                                            const totalAsistencias = est.totalAsistencias || 0
                                            const porcentajeFaltas = totalAsistencias > 0 ? Math.round((totalFaltas / totalAsistencias) * 100) : 0

                                            return (
                                                <tr key={index} className="hover:bg-blue-25">
                                                    <td className="border border-blue-200 p-3 text-blue-700 font-medium">
                                                        {est.codigoEstudiante}
                                                    </td>
                                                    <td className="border border-blue-200 p-3 text-blue-900">
                                                        {est.estudiante}
                                                    </td>
                                                    {materias.map(materia => {
                                                        const faltasMateria = est.faltasPorMateria[materia.codigo] || 0
                                                        const asistenciasMateria = est.asistenciasPorMateria[materia.codigo] || 0
                                                        const porcentajeMateria = asistenciasMateria > 0 ? Math.round((faltasMateria / asistenciasMateria) * 100) : 0

                                                        return (
                                                            <td key={materia.codigo} className="border border-blue-200 p-3 text-center">
                                                                <div className="space-y-1">
                                                                    <span className={`inline-block px-2 py-1 rounded text-sm font-bold ${faltasMateria > 0
                                                                        ? 'bg-red-100 text-red-800'
                                                                        : 'bg-green-100 text-green-800'
                                                                        }`}>
                                                                        {faltasMateria}
                                                                    </span>
                                                                    {asistenciasMateria > 0 && (
                                                                        <div className="text-xs text-gray-600">
                                                                            {porcentajeMateria}%
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        )
                                                    })}
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
                                                    <td className="border border-blue-200 p-3 text-center">
                                                        <div className="space-y-1">
                                                            <span className="text-sm font-medium text-blue-800">
                                                                {totalAsistencias}
                                                            </span>
                                                            {totalAsistencias > 0 && (
                                                                <div className="text-xs text-gray-600">
                                                                    {porcentajeFaltas}% faltas
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}

                                        {/* Fila de totales */}
                                        <tr className="bg-blue-100 font-bold">
                                            <td className="border border-blue-200 p-3 text-blue-800" colSpan="2">
                                                TOTALES
                                            </td>
                                            {materias.map(materia => {
                                                const totalMateria = estadisticas.reduce((sum, est) =>
                                                    sum + (est.faltasPorMateria[materia.codigo] || 0), 0)
                                                return (
                                                    <td key={materia.codigo} className="border border-blue-200 p-3 text-center text-blue-800">
                                                        {totalMateria}
                                                    </td>
                                                )
                                            })}
                                            <td className="border border-blue-200 p-3 text-center text-blue-800">
                                                {estadisticas.reduce((sum, est) => sum + est.totalFaltas, 0)}
                                            </td>
                                            <td className="border border-blue-200 p-3 text-center text-blue-800">
                                                {estadisticas.reduce((sum, est) => sum + est.totalAsistencias, 0)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/95 p-4 md:p-6 rounded-xl shadow-lg border border-white/40 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    <ChartBarIcon className="h-8 w-8 text-blue-600 mr-3" />
                                    <div>
                                        <h2 className="text-xl md:text-2xl font-bold text-blue-800">
                                            Estadísticas de Faltas por Materia
                                        </h2>
                                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-sm text-blue-700">
                                                <span className="font-semibold">📅 Período Académico:</span> {
                                                    periodosAcademicos[periodoSeleccionado]?.nombre ||
                                                    `Período ${periodoSeleccionado}`
                                                }
                                            </p>
                                            <p className="text-sm text-blue-600 mt-1">
                                                <span className="font-medium">📆 Fechas:</span> {
                                                    periodosAcademicos[periodoSeleccionado]?.fechaInicio ||
                                                    periodosFormateados[periodoSeleccionado]?.fechaInicio
                                                } al {
                                                    periodosAcademicos[periodoSeleccionado]?.fechaFin ||
                                                    periodosFormateados[periodoSeleccionado]?.fechaFin
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowEstadisticas(false)}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    <ChevronUpIcon className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="text-center py-12">
                                <ChartBarIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay estadísticas disponibles</h3>
                                <p className="text-gray-500 mb-4">
                                    Para ver estadísticas, primero marca algunas asistencias en diferentes fechas del período seleccionado.
                                </p>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                                    <p className="text-sm text-blue-700">
                                        <span className="font-semibold">💡 Consejo:</span> Las estadísticas se generan automáticamente cuando registras asistencias.
                                        Asegúrate de marcar faltas en varias fechas para ver datos completos.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
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
