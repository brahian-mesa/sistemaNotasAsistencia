import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, BookOpenIcon, AcademicCapIcon, ArrowLeftIcon, UserPlusIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import PageContainer from '../components/PageContainer'
import * as XLSX from 'xlsx'
import db from '../utils/database'

export default function Materias() {
    // Cargar datos desde la base de datos
    const [materias, setMaterias] = useState([])
    const [estudiantes, setEstudiantes] = useState([])

    const [showAddModal, setShowAddModal] = useState(false)
    const [editingMateria, setEditingMateria] = useState(null)
    const [selectedMateria, setSelectedMateria] = useState(null)
    const [showAddStudentModal, setShowAddStudentModal] = useState(false)
    const [selectedPeriodo, setSelectedPeriodo] = useState(1)
    const [showAddTipoNotaModal, setShowAddTipoNotaModal] = useState(false)
    const [tipoNotaForm, setTipoNotaForm] = useState({ titulo: '', descripcion: '' })
    const [notasTemporales, setNotasTemporales] = useState({})
    const [tiposNotaPeriodo, setTiposNotaPeriodo] = useState({})
    const [notas, setNotas] = useState({})
    const [formData, setFormData] = useState({
        nombre: '',
        codigo: '',
        grado: '',
        horario: ''
    })
    const [studentForm, setStudentForm] = useState({
        nombre: '',
        codigo: ''
    })

    // Estado para indicador de guardado automático
    const [autoSaveStatus, setAutoSaveStatus] = useState('')

    // Función para mostrar estado de guardado
    const mostrarEstadoGuardado = (mensaje) => {
        setAutoSaveStatus(mensaje)
        setTimeout(() => setAutoSaveStatus(''), 3000)
    }

    // Cargar datos al inicializar
    useEffect(() => {
        cargarDatos()
    }, [])

    const cargarDatos = () => {
        try {
            const materiasDB = db.getMaterias()
            const estudiantesDB = db.getEstudiantes()

            setMaterias(materiasDB)
            setEstudiantes(estudiantesDB)

            // Cargar tipos de nota persistidos y migrar si es necesario
            const tiposNotaGuardados = db.getTiposNotaPeriodo()
            const tiposNotaMigrados = migrarTiposNota(tiposNotaGuardados, materiasDB)
            setTiposNotaPeriodo(tiposNotaMigrados)

            // Cargar notas detalladas
            const notasGuardadas = db.getNotasDetalladas()
            setNotas(notasGuardadas)

            console.log('✅ Datos cargados desde la base de datos:')
            console.log('📚 Materias:', materiasDB.length)
            console.log('👥 Estudiantes:', estudiantesDB.length)
            console.log('📝 Tipos de nota:', Object.keys(tiposNotaMigrados).length)
            console.log('🎯 Notas cargadas:', Object.keys(notasGuardadas).length)
        } catch (error) {
            console.error('❌ Error cargando datos:', error)
        }
    }

    // Función para migrar datos de tipos de nota del formato antiguo al nuevo
    const migrarTiposNota = (tiposNotaGuardados, materias) => {
        // Si ya está en el nuevo formato (tiene materiaId como clave), retornar tal como está
        if (Object.keys(tiposNotaGuardados).length === 0) {
            return tiposNotaGuardados
        }

        const primeraClaveEsMateria = materias.some(materia =>
            tiposNotaGuardados.hasOwnProperty(materia.id)
        )

        if (primeraClaveEsMateria) {
            // Ya está en el nuevo formato
            return tiposNotaGuardados
        }

        // Está en formato antiguo, migrar a nuevo formato
        console.log('🔄 Migrando tipos de nota al nuevo formato...')
        const tiposNotaMigrados = {}

        // Para cada materia, copiar los tipos de nota globales
        materias.forEach(materia => {
            tiposNotaMigrados[materia.id] = { ...tiposNotaGuardados }
        })

        // Guardar en el nuevo formato
        setTimeout(() => {
            db.guardarTiposNotaPeriodo(tiposNotaMigrados)
        }, 100)

        return tiposNotaMigrados
    }

    // Auto-guardar tipos de nota cuando cambien
    useEffect(() => {
        if (Object.keys(tiposNotaPeriodo).length > 0) {
            db.guardarTiposNotaPeriodo(tiposNotaPeriodo)
        }
    }, [tiposNotaPeriodo])

    // Auto-guardar notas cuando cambien
    useEffect(() => {
        if (Object.keys(notas).length > 0) {
            db.guardarNotasDetalladas(notas)
        }
    }, [notas])

    const handleAddMateria = () => {
        if (!formData.nombre.trim()) return

        try {
            const colors = [
                'bg-blue-100 text-blue-800 border-blue-200',
                'bg-green-100 text-green-800 border-green-200',
                'bg-purple-100 text-purple-800 border-purple-200',
                'bg-red-100 text-red-800 border-red-200',
                'bg-orange-100 text-orange-800 border-orange-200',
                'bg-indigo-100 text-indigo-800 border-indigo-200'
            ]

            const nuevaMateria = {
                nombre: formData.nombre.trim(),
                codigo: formData.codigo.trim() || formData.nombre.substring(0, 3).toUpperCase(),
                grado: formData.grado || '5b',
                horario: formData.horario.trim() || 'Por definir',
                color: colors[Math.floor(Math.random() * colors.length)]
            }

            const materiaGuardada = db.guardarMateria(nuevaMateria)
            setMaterias(prev => [...prev, materiaGuardada])
            resetForm()
            console.log('✅ Materia agregada:', materiaGuardada)
        } catch (error) {
            console.error('❌ Error agregando materia:', error)
            alert('Error al agregar la materia')
        }
    }

    const handleEditMateria = (materia) => {
        setEditingMateria(materia)
        setFormData({
            nombre: materia.nombre,
            codigo: materia.codigo,
            grado: materia.grado,
            horario: materia.horario
        })
        setShowAddModal(true)
    }

    const handleUpdateMateria = () => {
        if (!formData.nombre.trim()) return

        try {
            const datosActualizados = {
                nombre: formData.nombre.trim(),
                codigo: formData.codigo.trim(),
                grado: formData.grado,
                horario: formData.horario.trim()
            }

            const materiaActualizada = db.actualizarMateria(editingMateria.id, datosActualizados)

            if (materiaActualizada) {
                setMaterias(prev => prev.map(materia =>
                    materia.id === editingMateria.id ? materiaActualizada : materia
                ))
                resetForm()
                console.log('✅ Materia actualizada:', materiaActualizada)
            }
        } catch (error) {
            console.error('❌ Error actualizando materia:', error)
            alert('Error al actualizar la materia')
        }
    }

    const handleDeleteMateria = (id) => {
        if (confirm('¿Estás seguro de que quieres eliminar esta materia?')) {
            try {
                db.eliminarMateria(id)
                setMaterias(prev => prev.filter(materia => materia.id !== id))
                console.log('✅ Materia eliminada')
            } catch (error) {
                console.error('❌ Error eliminando materia:', error)
                alert('Error al eliminar la materia')
            }
        }
    }

    const handleSelectMateria = (materia) => {
        setSelectedMateria(materia)
        // Inicializar notas para esta materia si no existen
        if (!notas[materia.id]) {
            const nuevasNotas = {}
            estudiantes.forEach(est => {
                nuevasNotas[est.id] = {
                    periodo1: [],
                    periodo2: [],
                    periodo3: [],
                    periodo4: []
                }
            })
            setNotas(prev => ({
                ...prev,
                [materia.id]: nuevasNotas
            }))
        }

        // Inicializar tipos de nota para esta materia si no existen
        if (!tiposNotaPeriodo[materia.id]) {
            setTiposNotaPeriodo(prev => ({
                ...prev,
                [materia.id]: {
                    1: [],
                    2: [],
                    3: [],
                    4: []
                }
            }))
        }
    }

    // Función para generar el siguiente código disponible
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

    const agregarTipoNota = () => {
        if (!tipoNotaForm.titulo.trim()) return

        const tipoNotaId = Date.now()
        const titulo = tipoNotaForm.titulo.trim()

        // Registrar el tipo de nota para esta materia y período específico
        setTiposNotaPeriodo(prev => ({
            ...prev,
            [selectedMateria.id]: {
                ...prev[selectedMateria.id],
                [selectedPeriodo]: [
                    ...(prev[selectedMateria.id]?.[selectedPeriodo] || []),
                    { id: tipoNotaId, titulo: titulo, descripcion: tipoNotaForm.descripcion.trim() }
                ]
            }
        }))

        setTipoNotaForm({ titulo: '', descripcion: '' })
        setShowAddTipoNotaModal(false)
    }

    const agregarNotaIndividual = (estudianteId, tipoNotaId, valor) => {
        // Si el valor está vacío, borrar la nota
        if (valor === '' || valor === null || valor === undefined) {
            borrarNotaIndividual(estudianteId, tipoNotaId)
            return
        }

        // Validar que el valor esté entre 1 y 5
        const nota = parseFloat(valor)
        if (isNaN(nota) || nota <= 0 || nota > 5) {
            mostrarEstadoGuardado('❌ La nota debe estar entre 1.0 y 5.0')
            return
        }

        const periodoKey = `periodo${selectedPeriodo}`
        const tipoNota = tiposNotaPeriodo[selectedMateria.id]?.[selectedPeriodo]?.find(t => t.id === tipoNotaId)
        if (!tipoNota) return

        // Guardar en la base de datos inmediatamente
        try {
            db.guardarNotaIndividual(
                selectedMateria.id,
                estudianteId,
                selectedPeriodo,
                tipoNotaId,
                tipoNota.titulo,
                nota
            )
        } catch (error) {
            console.error('Error guardando nota en BD:', error)
        }

        setNotas(prev => {
            const nuevasNotas = { ...prev }

            if (!nuevasNotas[selectedMateria.id]) nuevasNotas[selectedMateria.id] = {}
            if (!nuevasNotas[selectedMateria.id][estudianteId]) nuevasNotas[selectedMateria.id][estudianteId] = {}
            if (!nuevasNotas[selectedMateria.id][estudianteId][periodoKey]) nuevasNotas[selectedMateria.id][estudianteId][periodoKey] = []

            // Verificar si ya existe una nota de este tipo
            const notaExistente = nuevasNotas[selectedMateria.id][estudianteId][periodoKey].find(n => n.tipoId === tipoNotaId)

            if (notaExistente) {
                // Actualizar nota existente
                notaExistente.valor = nota
                notaExistente.updated_at = new Date().toISOString()
            } else {
                // Agregar nueva nota
                nuevasNotas[selectedMateria.id][estudianteId][periodoKey].push({
                    id: Date.now() + estudianteId,
                    tipoId: tipoNotaId,
                    titulo: tipoNota.titulo,
                    valor: nota,
                    fecha: new Date().toISOString().split('T')[0],
                    created_at: new Date().toISOString()
                })
            }

            return nuevasNotas
        })

        // Mostrar confirmación visual
        console.log(`✅ Nota guardada: ${tipoNota.titulo} = ${nota}`)
        mostrarEstadoGuardado(`✅ Guardado: ${tipoNota.titulo} = ${nota}`)
    }

    const borrarNotaIndividual = (estudianteId, tipoNotaId) => {
        const periodoKey = `periodo${selectedPeriodo}`
        const tipoNota = tiposNotaPeriodo[selectedMateria.id]?.[selectedPeriodo]?.find(t => t.id === tipoNotaId)
        if (!tipoNota) return

        // Eliminar de la base de datos usando el método correcto
        try {
            db.eliminarNotaIndividual(
                selectedMateria.id,
                estudianteId,
                selectedPeriodo,
                tipoNotaId
            )
        } catch (error) {
            console.error('Error eliminando nota de BD:', error)
        }

        setNotas(prev => {
            const nuevasNotas = { ...prev }

            if (nuevasNotas[selectedMateria.id] &&
                nuevasNotas[selectedMateria.id][estudianteId] &&
                nuevasNotas[selectedMateria.id][estudianteId][periodoKey]) {

                // Filtrar la nota específica
                nuevasNotas[selectedMateria.id][estudianteId][periodoKey] =
                    nuevasNotas[selectedMateria.id][estudianteId][periodoKey].filter(n => n.tipoId !== tipoNotaId)
            }

            return nuevasNotas
        })

        // Mostrar confirmación visual
        console.log(`🗑️ Nota eliminada: ${tipoNota.titulo}`)
        mostrarEstadoGuardado(`🗑️ Eliminado: ${tipoNota.titulo}`)
    }

    const obtenerNotaPorTipo = (estudianteId, tipoNotaId) => {
        const periodoKey = `periodo${selectedPeriodo}`
        const notasPeriodo = notas[selectedMateria.id]?.[estudianteId]?.[periodoKey] || []
        const nota = notasPeriodo.find(n => n.tipoId === tipoNotaId)
        return nota ? nota.valor : ''
    }

    const copiarDatos = () => {
        const datos = {
            materias,
            estudiantes,
            notas,
            tiposNotaPeriodo
        }
        navigator.clipboard.writeText(JSON.stringify(datos, null, 2))
        alert('Datos copiados al portapapeles')
    }

    const eliminarTipoNota = (tipoNotaId) => {
        // Eliminar el tipo de nota solo de la materia actual
        setTiposNotaPeriodo(prev => ({
            ...prev,
            [selectedMateria.id]: {
                ...prev[selectedMateria.id],
                [selectedPeriodo]: prev[selectedMateria.id]?.[selectedPeriodo]?.filter(t => t.id !== tipoNotaId) || []
            }
        }))

        // También eliminar las notas asociadas SOLO de la materia actual
        setNotas(prev => {
            const nuevasNotas = { ...prev }
            if (nuevasNotas[selectedMateria.id]) {
                Object.keys(nuevasNotas[selectedMateria.id]).forEach(estudianteId => {
                    const periodoKey = `periodo${selectedPeriodo}`
                    if (nuevasNotas[selectedMateria.id][estudianteId]?.[periodoKey]) {
                        nuevasNotas[selectedMateria.id][estudianteId][periodoKey] =
                            nuevasNotas[selectedMateria.id][estudianteId][periodoKey].filter(n => n.tipoId !== tipoNotaId)
                    }
                })
            }
            return nuevasNotas
        })
    }

    const calcularPromedioPeriodo = (estudianteId, periodo) => {
        const periodoKey = `periodo${periodo}`
        const notasPeriodo = notas[selectedMateria.id]?.[estudianteId]?.[periodoKey] || []
        if (notasPeriodo.length === 0) return 0
        const suma = notasPeriodo.reduce((acc, nota) => acc + nota.valor, 0)
        return Math.round((suma / notasPeriodo.length) * 100) / 100
    }

    const calcularPromedio = (estudianteId) => {
        const promedios = [1, 2, 3, 4].map(periodo => calcularPromedioPeriodo(estudianteId, periodo))
        const promedioGeneral = promedios.reduce((acc, prom) => acc + prom, 0) / 4
        return Math.round(promedioGeneral * 100) / 100
    }

    const getEstadoNota = (promedio) => {
        if (promedio >= 3.5) return 'text-green-600 font-bold'
        if (promedio >= 3.0) return 'text-yellow-600 font-bold'
        return 'text-red-600 font-bold'
    }

    const guardarNotas = () => {
        try {
            // Forzar guardado manual de todas las notas
            db.guardarNotasDetalladas(notas)
            db.guardarTiposNotaPeriodo(tiposNotaPeriodo)

            alert('✅ Todas las notas han sido guardadas correctamente!\n💾 Los datos persistirán entre sesiones.')
            console.log('✅ Guardado manual completo:', {
                notas: Object.keys(notas).length,
                tiposNota: Object.keys(tiposNotaPeriodo).length
            })
        } catch (error) {
            console.error('❌ Error en guardado manual:', error)
            alert('❌ Error al guardar las notas. Por favor intenta de nuevo.')
        }
    }

    const resetForm = () => {
        setFormData({ nombre: '', codigo: '', grado: '', horario: '' })
        setEditingMateria(null)
        setShowAddModal(false)
    }

    const exportarNotasExcel = () => {
        if (!selectedMateria) {
            alert('Selecciona una materia primero')
            return
        }

        const wb = XLSX.utils.book_new()

        // Crear hoja de datos con encabezado institucional
        const datosHoja = []

        // Encabezado institucional
        datosHoja.push(['🏫', 'INSTITUCIÓN EDUCATIVA NUESTRA SEÑORA DE LOS DOLORES'])
        datosHoja.push(['', 'SEDE SALVADOR DUQUE'])
        datosHoja.push(['', `NOTAS - ${selectedMateria.nombre.toUpperCase()}`])
        datosHoja.push(['', `GRADO: ${selectedMateria.grado || '5B'}`])
        datosHoja.push(['', `FECHA: ${new Date().toLocaleDateString('es-ES')}`])
        datosHoja.push([]) // Fila vacía

        // Obtener todas las actividades del período seleccionado
        const tiposActividad = tiposNotaPeriodo[selectedMateria.id]?.[selectedPeriodo] || []
        const nombresPeriodos = ['Período 1', 'Período 2', 'Período 3', 'Período 4']

        if (tiposActividad.length > 0) {
            // Encabezados para actividades específicas
            const encabezados = ['Estudiante']

            // Agregar cada actividad como columna individual
            tiposActividad.forEach(tipo => {
                encabezados.push(tipo.titulo)
            })

            // Agregar columna de actividades combinadas
            const nombresActividades = tiposActividad.map(t => t.titulo).join(' | ')
            encabezados.push('ACTIVIDAD')
            encabezados.push(`Promedio ${nombresPeriodos[selectedPeriodo - 1]}`)

            datosHoja.push(encabezados)

            // Datos de estudiantes
            estudiantes.forEach(estudiante => {
                const fila = [estudiante.nombre]

                // Agregar nota de cada actividad
                tiposActividad.forEach(tipo => {
                    const nota = obtenerNotaPorTipo(estudiante.id, tipo.id)
                    fila.push(nota || '')
                })

                // Agregar columna ACTIVIDAD con nombres de actividades
                fila.push(nombresActividades)

                // Promedio del período
                fila.push(calcularPromedioPeriodo(estudiante.id, selectedPeriodo))

                datosHoja.push(fila)
            })
        } else {
            // Si no hay actividades, mostrar solo promedios por período
            const encabezados = ['Estudiante', 'Período 1', 'Período 2', 'Período 3', 'Período 4', 'Promedio General']
            datosHoja.push(encabezados)

            estudiantes.forEach(estudiante => {
                const fila = [
                    estudiante.nombre,
                    calcularPromedioPeriodo(estudiante.id, 1),
                    calcularPromedioPeriodo(estudiante.id, 2),
                    calcularPromedioPeriodo(estudiante.id, 3),
                    calcularPromedioPeriodo(estudiante.id, 4),
                    calcularPromedio(estudiante.id)
                ]
                datosHoja.push(fila)
            })
        }

        const ws = XLSX.utils.aoa_to_sheet(datosHoja)

        // Ajustar ancho de columnas
        const colWidths = [{ wch: 35 }] // Columna de estudiantes más ancha
        if (tiposActividad.length > 0) {
            tiposActividad.forEach(() => colWidths.push({ wch: 12 })) // Actividades
            colWidths.push({ wch: 25 }) // ACTIVIDAD
            colWidths.push({ wch: 15 }) // Promedio
        } else {
            colWidths.push(...Array(5).fill({ wch: 12 })) // Períodos y promedio
        }
        ws['!cols'] = colWidths

        XLSX.utils.book_append_sheet(wb, ws, 'Notas')
        XLSX.writeFile(wb, `Notas_${selectedMateria.nombre}_${nombresPeriodos[selectedPeriodo - 1]}.xlsx`)

        console.log('✅ Excel exportado correctamente')
    }

    // Vista de notas de una materia específica
    if (selectedMateria) {
        const notasMateria = notas[selectedMateria.id] || {}

        return (
            <PageContainer>
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 flex flex-col min-h-screen pb-6">
                    {/* Header de la materia */}
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center p-4 md:p-6 border-b border-gray-200 gap-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSelectedMateria(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
                            </button>
                            <div className={`px-3 py-2 rounded-lg border text-sm font-medium ${selectedMateria.color}`}>
                                {selectedMateria.codigo}
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-gray-800">{selectedMateria.nombre}</h1>
                                <p className="text-gray-600">📅 {selectedMateria.horario}</p>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-3">
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-medium text-gray-700">Período:</label>
                                <select
                                    value={selectedPeriodo}
                                    onChange={(e) => setSelectedPeriodo(parseInt(e.target.value))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                >
                                    <option value={1}>Período 1</option>
                                    <option value={2}>Período 2</option>
                                    <option value={3}>Período 3</option>
                                    <option value={4}>Período 4</option>
                                </select>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {/* Indicador de auto-guardado */}
                                {autoSaveStatus && (
                                    <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium border border-green-200 animate-pulse">
                                        {autoSaveStatus}
                                    </div>
                                )}

                                <button
                                    onClick={() => setShowAddTipoNotaModal(true)}
                                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    Agregar Columna de Nota
                                </button>
                                <button
                                    onClick={copiarDatos}
                                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                                >
                                    📋 Copiar Datos
                                </button>
                                <button
                                    onClick={exportarNotasExcel}
                                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
                                >
                                    📊 Exportar a Excel
                                </button>
                                <button
                                    onClick={() => setShowAddStudentModal(true)}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                >
                                    <UserPlusIcon className="w-4 h-4" />
                                    Agregar Estudiante
                                </button>
                                <button
                                    onClick={guardarNotas}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <CheckCircleIcon className="w-4 h-4" />
                                    Guardar Notas
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 md:p-6 border-b border-gray-100">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-600 text-sm font-medium">Total Estudiantes</p>
                                    <p className="text-2xl font-bold text-blue-900">{estudiantes.length}</p>
                                </div>
                                <AcademicCapIcon className="w-8 h-8 text-blue-500" />
                            </div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-600 text-sm font-medium">Aprobados P{selectedPeriodo}</p>
                                    <p className="text-2xl font-bold text-green-900">
                                        {estudiantes.filter(est => calcularPromedioPeriodo(est.id, selectedPeriodo) >= 3.5).length}
                                    </p>
                                </div>
                                <CheckCircleIcon className="w-8 h-8 text-green-500" />
                            </div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-yellow-600 text-sm font-medium">Suficientes P{selectedPeriodo}</p>
                                    <p className="text-2xl font-bold text-yellow-900">
                                        {estudiantes.filter(est => {
                                            const prom = calcularPromedioPeriodo(est.id, selectedPeriodo)
                                            return prom >= 3.0 && prom < 3.5
                                        }).length}
                                    </p>
                                </div>
                                <PencilIcon className="w-8 h-8 text-yellow-500" />
                            </div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-red-600 text-sm font-medium">Reprobados P{selectedPeriodo}</p>
                                    <p className="text-2xl font-bold text-red-900">
                                        {estudiantes.filter(est => calcularPromedioPeriodo(est.id, selectedPeriodo) < 3.0).length}
                                    </p>
                                </div>
                                <XCircleIcon className="w-8 h-8 text-red-500" />
                            </div>
                        </div>
                    </div>

                    {/* Tabla de notas */}
                    <div className="p-4 md:p-6">
                        {(tiposNotaPeriodo[selectedMateria.id]?.[selectedPeriodo] || []).length === 0 ? (
                            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                                <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-lg font-medium text-gray-900">No hay tipos de nota creados</h3>
                                <p className="mt-1 text-gray-500">Comienza agregando una columna de nota para el Período {selectedPeriodo}</p>
                                <div className="mt-6">
                                    <button
                                        onClick={() => setShowAddTipoNotaModal(true)}
                                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 mx-auto"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                        Agregar Primera Columna
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <div className="overflow-auto max-h-[600px]">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Estudiante
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Código
                                                </th>
                                                {/* Columnas dinámicas para cada tipo de nota */}
                                                {(tiposNotaPeriodo[selectedMateria.id]?.[selectedPeriodo] || []).map((tipo) => (
                                                    <th key={tipo.id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <span>{tipo.titulo}</span>
                                                            <button
                                                                onClick={() => eliminarTipoNota(tipo.id)}
                                                                className="text-red-400 hover:text-red-600 ml-1"
                                                                title="Eliminar columna"
                                                            >
                                                                <TrashIcon className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </th>
                                                ))}
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Promedio
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Estado
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {estudiantes.map((estudiante) => {
                                                const promedioPeriodo = calcularPromedioPeriodo(estudiante.id, selectedPeriodo)
                                                const estadoPeriodo = getEstadoNota(promedioPeriodo.toFixed(1))

                                                return (
                                                    <tr key={estudiante.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">{estudiante.nombre}</div>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-500">{estudiante.codigo}</div>
                                                        </td>
                                                        {/* Celdas para cada tipo de nota */}
                                                        {(tiposNotaPeriodo[selectedMateria.id]?.[selectedPeriodo] || []).map((tipo) => {
                                                            const notaActual = obtenerNotaPorTipo(estudiante.id, tipo.id)
                                                            return (
                                                                <td key={tipo.id} className="px-3 py-4 whitespace-nowrap text-center">
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        max="5"
                                                                        step="0.1"
                                                                        value={notaActual}
                                                                        onChange={(e) => agregarNotaIndividual(estudiante.id, tipo.id, e.target.value)}
                                                                        onBlur={() => {
                                                                            // Mostrar feedback visual cuando se guarda
                                                                            if (obtenerNotaPorTipo(estudiante.id, tipo.id)) {
                                                                                const input = document.activeElement
                                                                                if (input) {
                                                                                    input.style.backgroundColor = '#dcfce7' // verde claro
                                                                                    setTimeout(() => {
                                                                                        input.style.backgroundColor = ''
                                                                                    }, 1000)
                                                                                }
                                                                            }
                                                                        }}
                                                                        className="w-16 p-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                        placeholder="1.0"
                                                                    />
                                                                </td>
                                                            )
                                                        })}
                                                        <td className="px-4 py-4 whitespace-nowrap text-center">
                                                            <span className="text-lg font-semibold text-blue-600">
                                                                {promedioPeriodo.toFixed(1)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-center">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoPeriodo}`}>
                                                                {promedioPeriodo >= 3.5 ? 'Aprobado' : promedioPeriodo >= 3.0 ? 'Suficiente' : 'Reprobado'}
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

                    {/* Títulos de notas del período */}
                    <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-purple-800 mb-3">📝 Notas del Período {selectedPeriodo}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-auto">
                            {estudiantes.map((estudiante) => {
                                const notasPeriodo = notasMateria[estudiante.id]?.[`periodo${selectedPeriodo}`] || []
                                if (notasPeriodo.length === 0) return null

                                return (
                                    <div key={estudiante.id} className="bg-white rounded-lg p-3 border border-purple-200">
                                        <h4 className="font-semibold text-gray-800 mb-2">{estudiante.nombre}</h4>
                                        <div className="space-y-1">
                                            {notasPeriodo.map((nota) => (
                                                <div key={nota.id} className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-700">{nota.titulo}</span>
                                                    <span className="font-semibold text-purple-600">{nota.valor}</span>
                                                </div>
                                            ))}
                                            <div className="border-t border-gray-200 pt-1 mt-2">
                                                <div className="flex justify-between items-center text-sm font-semibold">
                                                    <span className="text-gray-800">Promedio:</span>
                                                    <span className="text-purple-700">{calcularPromedioPeriodo(estudiante.id, selectedPeriodo).toFixed(1)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            {estudiantes.every(est => (notasMateria[est.id]?.[`periodo${selectedPeriodo}`] || []).length === 0) && (
                                <div className="col-span-full text-center text-gray-500 py-8">
                                    No hay notas registradas para el Período {selectedPeriodo}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modal para agregar estudiante */}
                {showAddStudentModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 w-full max-w-md mx-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-800">Agregar Nuevo Estudiante</h3>
                                <button
                                    onClick={() => setShowAddStudentModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre Completo *
                                    </label>
                                    <input
                                        type="text"
                                        value={studentForm.nombre}
                                        onChange={(e) => setStudentForm({ ...studentForm, nombre: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ej: Juan Pérez García"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Código Estudiantil *
                                    </label>
                                    <input
                                        type="text"
                                        value={studentForm.codigo}
                                        onChange={(e) => setStudentForm({ ...studentForm, codigo: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ej: 5B011"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowAddStudentModal(false)}
                                    className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddStudent}
                                    disabled={!studentForm.nombre.trim() || !studentForm.codigo.trim()}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    Agregar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal para agregar tipo de nota */}
                {showAddTipoNotaModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 w-full max-w-md mx-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-800">
                                    Crear Tipo de Nota - Período {selectedPeriodo}
                                </h3>
                                <button
                                    onClick={() => setShowAddTipoNotaModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Título de la Evaluación *
                                    </label>
                                    <input
                                        type="text"
                                        value={tipoNotaForm.titulo}
                                        onChange={(e) => setTipoNotaForm({ ...tipoNotaForm, titulo: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Ej: Examen Final, Quiz 1, Taller Grupal..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Descripción (Opcional)
                                    </label>
                                    <textarea
                                        value={tipoNotaForm.descripcion}
                                        onChange={(e) => setTipoNotaForm({ ...tipoNotaForm, descripcion: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Descripción adicional de la evaluación..."
                                        rows="2"
                                    />
                                </div>

                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <p className="text-sm text-green-700">
                                        ✨ Esto creará una <strong>nueva columna</strong> en la tabla para que puedas ingresar las notas directamente en cada fila.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowAddTipoNotaModal(false)}
                                    className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={agregarTipoNota}
                                    disabled={!tipoNotaForm.titulo.trim()}
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    Crear Evaluación
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </PageContainer>
        )
    }

    // Vista principal de materias
    return (
        <PageContainer>
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 flex flex-col min-h-screen pb-6">
                {/* Header */}
                <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <BookOpenIcon className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Gestión de Materias</h1>
                            <p className="text-gray-600">Administra las materias del grado 5b</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Agregar Materia
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 md:p-6 border-b border-gray-100">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-600 text-sm font-medium">Total Materias</p>
                                <p className="text-2xl font-bold text-blue-900">{materias.length}</p>
                            </div>
                            <AcademicCapIcon className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-600 text-sm font-medium">Grado</p>
                                <p className="text-2xl font-bold text-green-900">5b</p>
                            </div>
                            <BookOpenIcon className="w-8 h-8 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-600 text-sm font-medium">Estudiantes</p>
                                <p className="text-2xl font-bold text-purple-900">{estudiantes.length}</p>
                            </div>
                            <AcademicCapIcon className="w-8 h-8 text-purple-500" />
                        </div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-600 text-sm font-medium">Días Activos</p>
                                <p className="text-2xl font-bold text-orange-900">5</p>
                            </div>
                            <BookOpenIcon className="w-8 h-8 text-orange-500" />
                        </div>
                    </div>
                </div>

                {/* Tabla de materias */}
                <div className="p-4 md:p-6">
                    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                        {materias.map((materia) => (
                            <div
                                key={materia.id}
                                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                onClick={() => handleSelectMateria(materia)}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className={`px-2 py-1 rounded-lg text-xs font-medium border ${materia.color}`}>
                                        {materia.codigo}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleEditMateria(materia)
                                            }}
                                            className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDeleteMateria(materia.id)
                                            }}
                                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                                    {materia.nombre}
                                </h3>
                                <div className="space-y-1 text-sm text-gray-600">
                                    <p><span className="font-medium">Grado:</span> {materia.grado}</p>
                                    <p><span className="font-medium">Días:</span> {materia.horario}</p>
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-xs text-blue-600 font-medium">
                                        📊 Clic para gestionar notas
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal para agregar/editar materia */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 w-full max-w-md mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingMateria ? 'Editar Materia' : 'Agregar Nueva Materia'}
                            </h3>
                            <button
                                onClick={resetForm}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre de la Materia *
                                </label>
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Ej: Matemáticas"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Código
                                </label>
                                <input
                                    type="text"
                                    value={formData.codigo}
                                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Ej: MAT"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Grado
                                </label>
                                <select
                                    value={formData.grado}
                                    onChange={(e) => setFormData({ ...formData, grado: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="">Seleccionar grado</option>
                                    <option value="1°">1°</option>
                                    <option value="2°">2°</option>
                                    <option value="3°">3°</option>
                                    <option value="4°">4°</option>
                                    <option value="5a">5a</option>
                                    <option value="5b">5b</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Días de Clase
                                </label>
                                <input
                                    type="text"
                                    value={formData.horario}
                                    onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Ej: Lunes, Martes, Miércoles"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={resetForm}
                                className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={editingMateria ? handleUpdateMateria : handleAddMateria}
                                disabled={!formData.nombre.trim()}
                                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                {editingMateria ? 'Actualizar' : 'Agregar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageContainer>
    )
}