import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, BookOpenIcon, AcademicCapIcon, ArrowLeftIcon, UserPlusIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import PageContainer from '../components/PageContainer'
import * as XLSX from 'xlsx'
import db from '../utils/database'
import auth from '../utils/auth'
import supabase from '../utils/supabase'

export default function Materias() {
    // Cargar datos desde la base de datos
    const [materias, setMaterias] = useState([])
    const [estudiantes, setEstudiantes] = useState([])

    const [showAddModal, setShowAddModal] = useState(false)
    const [editingMateria, setEditingMateria] = useState(null)
    const [selectedMateria, setSelectedMateria] = useState(null)
    const [showAddStudentModal, setShowAddStudentModal] = useState(false)
    const [selectedPeriodo, setSelectedPeriodo] = useState(1) // Siempre empezar con período 1
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

    // Estados de loading y errores
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

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

    // Función para mostrar estado de guardado
    const mostrarEstadoGuardado = (mensaje) => {
        setAutoSaveStatus(mensaje)
        setTimeout(() => setAutoSaveStatus(''), 3000)
    }

    // Cargar datos al inicializar
    useEffect(() => {
        cargarDatos()
        cargarPeriodosAcademicos()
    }, [])

    // Cargar notas individuales desde Supabase
    const cargarNotasIndividuales = async () => {
        try {
            console.log('🔄 Cargando notas individuales desde Supabase...');
            const currentUser = auth.getCurrentUser();

            if (!currentUser?.id) {
                console.log('⚠️ No hay usuario autenticado');
                mostrarEstadoGuardado('❌ No hay usuario autenticado');
                return;
            }

            // Obtener todas las notas individuales del usuario
            const { data: notasDB, error } = await supabase
                .from('notas_individuales')
                .select('*')
                .eq('usuario_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Error obteniendo notas individuales:', error);
                mostrarEstadoGuardado('❌ Error cargando notas desde BD');
                return;
            }

            console.log('📊 Notas individuales obtenidas:', notasDB.length);

            // Convertir a formato del estado local
            const notasFormateadas = {};

            notasDB.forEach(nota => {
                const materiaId = nota.materia_id;
                const estudianteId = nota.estudiante_id;
                const periodoKey = `periodo${nota.periodo}`;

                if (!notasFormateadas[materiaId]) {
                    notasFormateadas[materiaId] = {};
                }
                if (!notasFormateadas[materiaId][estudianteId]) {
                    notasFormateadas[materiaId][estudianteId] = {};
                }
                if (!notasFormateadas[materiaId][estudianteId][periodoKey]) {
                    notasFormateadas[materiaId][estudianteId][periodoKey] = [];
                }

                notasFormateadas[materiaId][estudianteId][periodoKey].push({
                    id: nota.id,
                    tipoId: nota.tipo_nota_id,
                    titulo: nota.titulo,
                    valor: nota.valor,
                    fecha: nota.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                    created_at: nota.created_at
                });
            });

            console.log('✅ Notas individuales formateadas:', Object.keys(notasFormateadas).length, 'materias');

            // Actualizar estado con las notas de la base de datos
            setNotas(prev => {
                const notasActualizadas = { ...prev, ...notasFormateadas };
                console.log('📊 Estado de notas actualizado desde Supabase');
                return notasActualizadas;
            });

            // Mostrar confirmación de carga exitosa
            const totalNotas = Object.values(notasFormateadas).reduce((acc, materia) => {
                return acc + Object.values(materia).reduce((acc2, estudiante) => {
                    return acc2 + Object.values(estudiante).reduce((acc3, periodo) => acc3 + periodo.length, 0);
                }, 0);
            }, 0);

            mostrarEstadoGuardado(`✅ ${totalNotas} notas cargadas desde BD`);

        } catch (error) {
            console.error('❌ Error cargando notas individuales:', error);
            mostrarEstadoGuardado('❌ Error cargando notas');
        }
    }

    const cargarPeriodosAcademicos = async () => {
        try {
            const periodos = await db.getPeriodosAcademicos()
            setPeriodosAcademicos(periodos)
        } catch (error) {
            console.error('Error cargando períodos académicos:', error)
        }
    }

    const cargarDatos = async () => {
        try {
            setIsLoading(true)
            setError(null)
            console.log('🔄 Cargando datos...');

            const currentUser = auth.getCurrentUser()

            if (!currentUser) {
                throw new Error('No hay usuario autenticado')
            }

            // Cargar datos en paralelo para mayor velocidad
            const [materiasDB, estudiantesDB, tiposNotaGuardados, notasGuardadas] = await Promise.all([
                db.getMaterias(),
                db.getEstudiantes(),
                db.getTiposNotaPeriodo(),
                db.getNotasDetalladas()
            ]);

            // Las materias ya vienen filtradas por usuario_id desde database.js
            const materiasUsuario = materiasDB.filter(m => m.usuario_id === currentUser.id)
            console.log('🔍 Materias filtradas por usuario:', materiasUsuario.length);

            // Los estudiantes ya vienen filtrados por usuario_id desde database.js
            const estudiantesUsuario = estudiantesDB.filter(e => e.usuario_id === currentUser.id)
            console.log('🔍 Estudiantes filtrados por usuario:', estudiantesUsuario.length);

            setMaterias(materiasUsuario)
            setEstudiantes(estudiantesUsuario)

            // Cargar tipos de nota persistidos y migrar si es necesario
            const tiposNotaMigrados = migrarTiposNota(tiposNotaGuardados, materiasUsuario)
            setTiposNotaPeriodo(tiposNotaMigrados)

            // Cargar notas detalladas
            setNotas(notasGuardadas)

            // Cargar notas individuales desde Supabase
            await cargarNotasIndividuales()

            console.log('✅ Datos cargados exitosamente:')
            console.log('👤 Usuario:', currentUser?.nombre, '(ID:', currentUser?.id, ')')
            console.log('🎓 Grado:', currentUser?.grado)
            console.log('📚 Materias del usuario:', materiasDB.length)
            console.log('👥 Estudiantes del usuario:', estudiantesDB.length)
            console.log('📝 Tipos de nota:', Object.keys(tiposNotaMigrados).length)
            console.log('📊 Notas:', Object.keys(notasGuardadas).length)

            // Debug: mostrar materias encontradas
            if (materiasDB.length > 0) {
                console.log('🔍 Materias del usuario:', materiasDB.map(m => ({
                    nombre: m.nombre,
                    grado: m.grado,
                    usuario_id: m.usuario_id
                })));
            } else {
                console.log('⚠️ No se encontraron materias para el usuario');
            }

            // Debug: mostrar estudiantes encontrados
            if (estudiantesDB.length > 0) {
                console.log('🔍 Estudiantes del usuario:', estudiantesDB.map(e => ({
                    nombre: e.nombre,
                    codigo: e.codigo,
                    usuario_id: e.usuario_id
                })));
            } else {
                console.log('⚠️ No se encontraron estudiantes para el usuario');
            }
        } catch (error) {
            console.error('❌ Error cargando datos:', error)
            setError(error.message || 'Error al cargar los datos')
            mostrarEstadoGuardado('❌ Error al cargar los datos')
        } finally {
            setIsLoading(false)
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
        console.log('Migrando tipos de nota al nuevo formato...')
        const tiposNotaMigrados = {}

        // Para cada materia, copiar los tipos de nota globales
        materias.forEach(materia => {
            tiposNotaMigrados[materia.id] = { ...tiposNotaGuardados }
        })

        // Guardar en el nuevo formato
        setTimeout(async () => {
            try {
                await db.guardarTiposNotaPeriodo(tiposNotaMigrados)
            } catch (error) {
                console.error('Error guardando tipos de nota migrados:', error)
            }
        }, 100)

        return tiposNotaMigrados
    }

    // Auto-guardar tipos de nota cuando cambien
    useEffect(() => {
        if (Object.keys(tiposNotaPeriodo).length > 0) {
            // Agregar información del usuario a los tipos de nota
            const tiposConUsuario = {
                ...tiposNotaPeriodo,
                usuario_id: auth.getCurrentUser()?.id,
                usuario_nombre: auth.getCurrentUser()?.nombre,
                ultima_actualizacion: new Date().toISOString()
            }

            db.guardarTiposNotaPeriodo(tiposConUsuario).catch(error =>
                console.error('Error auto-guardando tipos de nota:', error)
            )
        }
    }, [tiposNotaPeriodo])

    // Auto-guardar notas cuando cambien
    useEffect(() => {
        if (Object.keys(notas).length > 0) {
            // Agregar información del usuario a las notas
            const notasConUsuario = {
                ...notas,
                usuario_id: auth.getCurrentUser()?.id,
                usuario_nombre: auth.getCurrentUser()?.nombre,
                ultima_actualizacion: new Date().toISOString()
            }

            db.guardarNotasDetalladas(notasConUsuario).catch(error =>
                console.error('Error auto-guardando notas:', error)
            )
        }
    }, [notas])

    const handleAddMateria = async () => {
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
                grado: formData.grado || auth.getCurrentUser()?.grado || 'Sin especificar',
                horario: formData.horario.trim() || 'Por definir',
                color: colors[Math.floor(Math.random() * colors.length)]
            }

            // Actualizar estado local primero para respuesta inmediata
            const materiaTemporal = {
                id: Date.now(),
                ...nuevaMateria,
                created_at: new Date().toISOString()
            }

            setMaterias(prev => [...prev, materiaTemporal])
            resetForm()

            // Guardar en la base de datos en segundo plano
            setTimeout(async () => {
                try {
                    const materiaGuardada = await db.guardarMateria(nuevaMateria)
                    console.log('✅ Materia guardada:', materiaGuardada)

                    // Actualizar la materia temporal con el ID real de la base de datos
                    setMaterias(prev => prev.map(m =>
                        m.id === materiaTemporal.id
                            ? { ...materiaGuardada, color: materiaTemporal.color }
                            : m
                    ))

                    mostrarEstadoGuardado(`✅ Materia "${materiaGuardada.nombre}" agregada para el grado ${materiaGuardada.grado}`)
                } catch (error) {
                    console.error('❌ Error guardando materia:', error)
                    // Revertir cambios si hay error
                    setMaterias(prev => prev.filter(m => m.id !== materiaTemporal.id))
                    alert('Error al guardar la materia en la base de datos')
                }
            }, 100)

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

    const handleUpdateMateria = async () => {
        if (!formData.nombre.trim()) return

        try {
            const datosActualizados = {
                nombre: formData.nombre.trim(),
                codigo: formData.codigo.trim(),
                grado: formData.grado,
                horario: formData.horario.trim()
            }

            const materiaActualizada = await db.actualizarMateria(editingMateria.id, datosActualizados)

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

    const handleDeleteMateria = async (id) => {
        if (confirm('¿Estás seguro de que quieres eliminar esta materia?')) {
            try {
                await db.eliminarMateria(id)
                setMaterias(prev => prev.filter(materia => materia.id !== id))
                console.log('✅ Materia eliminada')
            } catch (error) {
                console.error('❌ Error eliminando materia:', error)
                alert('Error al eliminar la materia')
            }
        }
    }

    const handleSelectMateria = async (materia) => {
        setSelectedMateria(materia)

        // Cargar notas individuales específicas para esta materia
        await cargarNotasIndividuales()

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

        // Mostrar mensaje de confirmación
        mostrarEstadoGuardado(`📚 Materia "${materia.nombre}" seleccionada - Notas cargadas desde BD`)
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

    const handleAddStudent = async () => {
        if (!studentForm.nombre.trim() || !studentForm.codigo.trim()) return

        try {
            let codigoFinal = studentForm.codigo.trim()

            // Verificar si el código ya existe
            const codigoExiste = estudiantes.some(est => est.codigo === codigoFinal)
            if (codigoExiste) {
                // Generar automáticamente el siguiente código disponible
                codigoFinal = generarSiguienteCodigo(codigoFinal)
                mostrarEstadoGuardado(`Código actualizado automáticamente: ${codigoFinal}`)
            }

            const nuevoEstudiante = {
                nombre: studentForm.nombre.trim(),
                codigo: codigoFinal,
                grado: auth.getCurrentUser()?.grado || 'Sin especificar'
            }

            // Actualizar estado local primero para respuesta inmediata
            const estudianteTemporal = {
                id: Date.now(),
                ...nuevoEstudiante,
                created_at: new Date().toISOString()
            }

            setEstudiantes(prev => [...prev, estudianteTemporal].sort((a, b) => {
                const codigoA = parseInt(a.codigo) || 0;
                const codigoB = parseInt(b.codigo) || 0;
                return codigoA - codigoB;
            }))
            setStudentForm({ nombre: '', codigo: '' })
            setShowAddStudentModal(false)

            // Guardar en la base de datos en segundo plano
            setTimeout(async () => {
                try {
                    const estudianteGuardado = await db.guardarEstudiante(nuevoEstudiante)
                    console.log('✅ Estudiante guardado:', estudianteGuardado)
                    mostrarEstadoGuardado(`Estudiante agregado: ${estudianteGuardado.codigo}`)
                } catch (error) {
                    console.error('❌ Error guardando estudiante:', error)
                    // Revertir cambios si hay error
                    setEstudiantes(prev => prev.filter(est => est.id !== estudianteTemporal.id))
                    alert('Error al guardar el estudiante en la base de datos')
                }
            }, 100)

        } catch (error) {
            console.error('❌ Error agregando estudiante:', error)
            alert('Error al agregar el estudiante')
        }
    }

    const agregarTipoNota = async () => {
        if (!tipoNotaForm.titulo.trim()) return

        // Generar ID más pequeño y seguro
        const tipoNotaId = Math.floor(Math.random() * 1000) + 1
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

        // Mostrar confirmación inmediata
        mostrarEstadoGuardado(`✅ Columna "${titulo}" agregada`)
        console.log(`✅ Tipo de nota agregado: ${titulo} (ID: ${tipoNotaId})`)

        setTipoNotaForm({ titulo: '', descripcion: '' })
        setShowAddTipoNotaModal(false)
    }

    const agregarNotaIndividual = async (estudianteId, tipoNotaId, valor) => {
        // Si el valor está vacío, borrar la nota
        if (valor === '' || valor === null || valor === undefined) {
            borrarNotaIndividual(estudianteId, tipoNotaId)
            return
        }

        // Validar que el valor esté entre 1 y 5
        const nota = parseFloat(valor)
        if (isNaN(nota) || nota <= 0 || nota > 5) {
            mostrarEstadoGuardado('La nota debe estar entre 1.0 y 5.0')
            return
        }

        const periodoKey = `periodo${selectedPeriodo}`
        const tipoNota = tiposNotaPeriodo[selectedMateria.id]?.[selectedPeriodo]?.find(t => t.id === tipoNotaId)
        if (!tipoNota) return

        // Actualizar estado local primero para respuesta inmediata
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
                console.log('📝 Nota actualizada en estado local:', notaExistente);
            } else {
                // Agregar nueva nota
                const nuevaNota = {
                    id: Math.floor(Math.random() * 10000) + estudianteId, // ID más pequeño
                    tipoId: tipoNotaId,
                    titulo: tipoNota.titulo,
                    valor: nota,
                    fecha: new Date().toISOString().split('T')[0],
                    created_at: new Date().toISOString()
                }
                nuevasNotas[selectedMateria.id][estudianteId][periodoKey].push(nuevaNota)
                console.log('📝 Nueva nota agregada al estado local:', nuevaNota);
            }

            console.log('📊 Estado de notas actualizado:', nuevasNotas[selectedMateria.id]);
            return nuevasNotas
        })

        // Guardar en la base de datos en segundo plano (sin bloquear la UI)
        setTimeout(async () => {
            try {
                // Validar que tipoNotaId sea un número válido
                const safeTipoNotaId = parseInt(tipoNotaId)
                if (isNaN(safeTipoNotaId) || safeTipoNotaId > 1000) {
                    console.error('❌ TipoNotaId inválido:', tipoNotaId)
                    return
                }

                await db.guardarNotaIndividual(
                    selectedMateria.id,
                    estudianteId,
                    selectedPeriodo,
                    safeTipoNotaId,
                    tipoNota.titulo,
                    nota
                )
                console.log(`✅ Nota guardada en Supabase: ${tipoNota.titulo} = ${nota}`)

                // Mostrar confirmación visual inmediata
                mostrarEstadoGuardado(`✅ ${tipoNota.titulo} = ${nota} guardado`)
            } catch (error) {
                console.error('❌ Error guardando nota en BD:', error)
                mostrarEstadoGuardado('❌ Error al guardar nota')
            }
        }, 100)

        // Mostrar confirmación visual inmediata
        mostrarEstadoGuardado(`Guardado: ${tipoNota.titulo} = ${nota}`)
    }

    const borrarNotaIndividual = async (estudianteId, tipoNotaId) => {
        const periodoKey = `periodo${selectedPeriodo}`
        const tipoNota = tiposNotaPeriodo[selectedMateria.id]?.[selectedPeriodo]?.find(t => t.id === tipoNotaId)
        if (!tipoNota) return

        // Eliminar de la base de datos usando el método correcto
        try {
            await db.eliminarNotaIndividual(
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
        console.log(`Nota eliminada: ${tipoNota.titulo}`)
        mostrarEstadoGuardado(`Eliminado: ${tipoNota.titulo}`)
    }

    const obtenerNotaPorTipo = (estudianteId, tipoNotaId) => {
        const periodoKey = `periodo${selectedPeriodo}`
        const notasPeriodo = notas[selectedMateria.id]?.[estudianteId]?.[periodoKey] || []
        const nota = notasPeriodo.find(n => n.tipoId === tipoNotaId)

        // Debug: mostrar información de la nota (solo en desarrollo)
        if (process.env.NODE_ENV === 'development') {
            if (nota) {
                console.log(`🔍 Nota encontrada para estudiante ${estudianteId}, tipo ${tipoNotaId}:`, nota.valor)
            }
        }

        return nota ? nota.valor : ''
    }

    const copiarDatos = async () => {
        const datos = {
            materias,
            estudiantes,
            notas,
            tiposNotaPeriodo
        }
        navigator.clipboard.writeText(JSON.stringify(datos, null, 2))
        alert('Datos copiados al portapapeles')
    }

    const eliminarTipoNota = async (tipoNotaId) => {
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

    const guardarNotas = async () => {
        try {
            // Forzar guardado manual de todas las notas
            await db.guardarNotasDetalladas(notas)
            await db.guardarTiposNotaPeriodo(tiposNotaPeriodo)

            alert('Todas las notas han sido guardadas correctamente!\nLos datos persistirán entre sesiones.')
            console.log('Guardado manual completo:', {
                notas: Object.keys(notas).length,
                tiposNota: Object.keys(tiposNotaPeriodo).length
            })
        } catch (error) {
            console.error('❌ Error en guardado manual:', error)
            alert('Error al guardar las notas. Por favor intenta de nuevo.')
        }
    }

    const resetForm = async () => {
        setFormData({ nombre: '', codigo: '', grado: '', horario: '' })
        setEditingMateria(null)
        setShowAddModal(false)
    }

    const exportarNotasExcel = async () => {
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
        datosHoja.push(['', `GRADO: ${selectedMateria.grado || 'Sin especificar'}`])
        datosHoja.push(['', `FECHA: ${new Date().toLocaleDateString('es-ES')}`])
        datosHoja.push([]) // Fila vacía

        // Obtener todas las actividades del período seleccionado
        const tiposActividad = tiposNotaPeriodo[selectedMateria.id]?.[selectedPeriodo] || []
        const nombresPeriodos = Object.values(periodosAcademicos).map(p => `${p.nombre} (${p.descripcion})`)

        if (tiposActividad.length > 0) {
            // Encabezados para actividades específicas
            const encabezados = ['Estudiante']

            // Agregar cada actividad como columna individual
            tiposActividad.forEach(tipo => {
                encabezados.push(tipo.titulo)
            })

            // Agregar columna de actividades combinadas
            const nombresActividades = tiposActividad.map(t => t.titulo).join(' | ')
            encabezados.push(`Promedio`)

            datosHoja.push(encabezados)

            // Datos de estudiantes
            estudiantes.forEach(estudiante => {
                const fila = [estudiante.nombre]

                // Agregar nota de cada actividad
                tiposActividad.forEach(tipo => {
                    const nota = obtenerNotaPorTipo(estudiante.id, tipo.id)
                    fila.push(nota || '')
                })

                // Promedio del período
                fila.push(calcularPromedioPeriodo(estudiante.id, selectedPeriodo))

                datosHoja.push(fila)
            })
        } else {
            // Si no hay actividades, mostrar solo promedios por período
            const encabezados = ['Estudiante',
                ...Object.values(periodosAcademicos).map(p => `${p.nombre} (${p.descripcion})`),
                'Promedio General'
            ]
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

        console.log('Excel exportado correctamente')
    }

    // Vista de notas de una materia específica
    if (selectedMateria) {
        const notasMateria = notas[selectedMateria.id] || {}

        // Debug: mostrar información de notas de la materia
        console.log('🔍 Notas de la materia:', selectedMateria.nombre, notasMateria);
        console.log('📊 Total estudiantes con notas:', Object.keys(notasMateria).length);

        // Mostrar notas por período
        Object.keys(notasMateria).forEach(estudianteId => {
            const estudiante = estudiantes.find(e => e.id === parseInt(estudianteId));
            if (estudiante) {
                console.log(`👤 ${estudiante.nombre}:`, notasMateria[estudianteId]);
            }
        });

        // Mostrar loading mientras se cargan los datos
        if (isLoading) {
            return (
                <PageContainer>
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 flex flex-col min-h-screen pb-6">
                        <div className="flex items-center justify-center min-h-[400px]">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Cargando datos...</h3>
                                <p className="text-gray-600">Obteniendo materias, estudiantes y notas desde la base de datos</p>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            )
        }

        // Mostrar error si hay algún problema
        if (error) {
            return (
                <PageContainer>
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 flex flex-col min-h-screen pb-6">
                        <div className="flex items-center justify-center min-h-[400px]">
                            <div className="text-center">
                                <div className="bg-red-100 rounded-full p-3 mx-auto mb-4">
                                    <XCircleIcon className="h-8 w-8 text-red-600" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar los datos</h3>
                                <p className="text-gray-600 mb-4">{error}</p>
                                <button
                                    onClick={() => {
                                        setError(null)
                                        cargarDatos()
                                    }}
                                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Reintentar
                                </button>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            )
        }

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
                                <p className="text-gray-600 flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {selectedMateria.horario}
                                </p>
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
                                    onClick={exportarNotasExcel}
                                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Exportar a Excel
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

                    {/* Resumen de notas del período - Vista mejorada como localStorage */}
                    <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-blue-800 flex items-center">
                                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                📊 Resumen de Notas - Período {selectedPeriodo}
                            </h3>
                            <button
                                onClick={cargarNotasIndividuales}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                🔄 Recargar desde BD
                            </button>
                        </div>

                        {/* Información del período */}
                        <div className="mb-4 p-3 bg-white rounded-lg border border-blue-100">
                            <div className="flex items-center justify-between text-sm text-blue-700">
                                <span className="font-medium">
                                    📅 {periodosFormateados[selectedPeriodo]?.descripcion || `Período ${selectedPeriodo}`}
                                </span>
                                <span className="text-blue-600">
                                    👥 {estudiantes.length} estudiantes registrados
                                </span>
                            </div>
                        </div>

                        {/* Tabla de resumen mejorada */}
                        <div className="bg-white rounded-lg border border-blue-200 overflow-hidden">
                            <div className="overflow-auto max-h-[500px]">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-blue-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                                                👤 Estudiante
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                                                🏷️ Código
                                            </th>
                                            <th className="px-3 py-3 text-center text-xs font-medium text-blue-600 uppercase tracking-wider">
                                                📝 Notas Registradas
                                            </th>
                                            <th className="px-3 py-3 text-center text-xs font-medium text-blue-600 uppercase tracking-wider">
                                                📊 Promedio
                                            </th>
                                            <th className="px-3 py-3 text-center text-xs font-medium text-blue-600 uppercase tracking-wider">
                                                🎯 Estado
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {estudiantes.map((estudiante) => {
                                            const notasPeriodo = notasMateria[estudiante.id]?.[`periodo${selectedPeriodo}`] || []
                                            const promedioPeriodo = calcularPromedioPeriodo(estudiante.id, selectedPeriodo)
                                            const estadoPeriodo = getEstadoNota(promedioPeriodo)

                                            return (
                                                <tr key={estudiante.id} className="hover:bg-blue-50 transition-colors">
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                                <span className="text-sm font-medium text-blue-600">
                                                                    {estudiante.nombre.charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <div className="ml-3">
                                                                <div className="text-sm font-medium text-gray-900">{estudiante.nombre}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                                                            {estudiante.codigo}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-4 whitespace-nowrap text-center">
                                                        <div className="flex flex-wrap gap-1 justify-center">
                                                            {notasPeriodo.length > 0 ? (
                                                                notasPeriodo.map((nota) => (
                                                                    <span
                                                                        key={nota.id}
                                                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                                                        title={`${nota.titulo}: ${nota.valor}`}
                                                                    >
                                                                        {nota.valor}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="text-gray-400 text-sm">Sin notas</span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {notasPeriodo.length} nota{notasPeriodo.length !== 1 ? 's' : ''}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-4 whitespace-nowrap text-center">
                                                        <div className="flex items-center justify-center">
                                                            <span className={`text-lg font-bold ${estadoPeriodo}`}>
                                                                {promedioPeriodo > 0 ? promedioPeriodo.toFixed(1) : '--'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-4 whitespace-nowrap text-center">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${promedioPeriodo >= 3.5 ? 'bg-green-100 text-green-800' :
                                                                promedioPeriodo >= 3.0 ? 'bg-yellow-100 text-yellow-800' :
                                                                    promedioPeriodo > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {promedioPeriodo >= 3.5 ? '✅ Aprobado' :
                                                                promedioPeriodo >= 3.0 ? '⚠️ Suficiente' :
                                                                    promedioPeriodo > 0 ? '❌ Reprobado' : '⏳ Sin notas'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Resumen estadístico */}
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-green-100 border border-green-200 rounded-lg p-3 text-center">
                                <div className="text-green-800 font-bold text-lg">
                                    {estudiantes.filter(est => calcularPromedioPeriodo(est.id, selectedPeriodo) >= 3.5).length}
                                </div>
                                <div className="text-green-600 text-xs">Aprobados</div>
                            </div>
                            <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-3 text-center">
                                <div className="text-yellow-800 font-bold text-lg">
                                    {estudiantes.filter(est => {
                                        const prom = calcularPromedioPeriodo(est.id, selectedPeriodo)
                                        return prom >= 3.0 && prom < 3.5
                                    }).length}
                                </div>
                                <div className="text-yellow-600 text-xs">Suficientes</div>
                            </div>
                            <div className="bg-red-100 border border-red-200 rounded-lg p-3 text-center">
                                <div className="text-red-800 font-bold text-lg">
                                    {estudiantes.filter(est => {
                                        const prom = calcularPromedioPeriodo(est.id, selectedPeriodo)
                                        return prom > 0 && prom < 3.0
                                    }).length}
                                </div>
                                <div className="text-red-600 text-xs">Reprobados</div>
                            </div>
                            <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 text-center">
                                <div className="text-gray-800 font-bold text-lg">
                                    {estudiantes.filter(est => calcularPromedioPeriodo(est.id, selectedPeriodo) === 0).length}
                                </div>
                                <div className="text-gray-600 text-xs">Sin notas</div>
                            </div>
                        </div>

                        {/* Mensaje si no hay notas */}
                        {estudiantes.every(est => (notasMateria[est.id]?.[`periodo${selectedPeriodo}`] || []).length === 0) && (
                            <div className="mt-4 text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="mt-2 text-lg font-medium text-gray-900">No hay notas registradas</h3>
                                <p className="mt-1 text-gray-500">Para el Período {selectedPeriodo} aún no se han registrado notas</p>
                                <div className="mt-4">
                                    <button
                                        onClick={() => setShowAddTipoNotaModal(true)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                        Agregar Primera Evaluación
                                    </button>
                                </div>
                            </div>
                        )}
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
    // Mostrar loading mientras se cargan los datos
    if (isLoading) {
        return (
            <PageContainer>
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 flex flex-col min-h-screen pb-6">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Cargando datos...</h3>
                            <p className="text-gray-600">Obteniendo materias, estudiantes y notas desde la base de datos</p>
                        </div>
                    </div>
                </div>
            </PageContainer>
        )
    }

    // Mostrar error si hay algún problema
    if (error) {
        return (
            <PageContainer>
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 flex flex-col min-h-screen pb-6">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <div className="bg-red-100 rounded-full p-3 mx-auto mb-4">
                                <XCircleIcon className="h-8 w-8 text-red-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar los datos</h3>
                            <p className="text-gray-600 mb-4">{error}</p>
                            <button
                                onClick={() => {
                                    setError(null)
                                    cargarDatos()
                                }}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                Reintentar
                            </button>
                        </div>
                    </div>
                </div>
            </PageContainer>
        )
    }

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
                            <p className="text-gray-600">
                                Administra las materias del grado {auth.getCurrentUser()?.grado || 'Sin especificar'}
                                {auth.getCurrentUser()?.nombre && ` - Prof. ${auth.getCurrentUser().nombre}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Indicador de estado de conexión */}
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-500' : isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
                            <span className="text-xs text-gray-600">
                                {error ? 'Error de conexión' : isLoading ? 'Cargando...' : 'Conectado a BD'}
                            </span>
                        </div>

                        {/* Indicador de estado */}
                        {autoSaveStatus && (
                            <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium border border-green-200 animate-pulse">
                                {autoSaveStatus}
                            </div>
                        )}
                        <button
                            onClick={cargarDatos}
                            disabled={isLoading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {isLoading ? 'Cargando...' : 'Recargar Datos'}
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Agregar Materia
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 p-4 md:p-6 border-b border-gray-100">
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
                                <p className="text-2xl font-bold text-green-900">{auth.getCurrentUser()?.grado || 'Sin especificar'}</p>
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
                    <div className={`p-4 rounded-lg ${error ? 'bg-red-50' : isLoading ? 'bg-yellow-50' : 'bg-green-50'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-medium ${error ? 'text-red-600' : isLoading ? 'text-yellow-600' : 'text-green-600'}`}>
                                    Estado BD
                                </p>
                                <p className={`text-lg font-bold ${error ? 'text-red-900' : isLoading ? 'text-yellow-900' : 'text-green-900'}`}>
                                    {error ? 'Error' : isLoading ? 'Cargando' : 'Conectado'}
                                </p>
                            </div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${error ? 'bg-red-200' : isLoading ? 'bg-yellow-200' : 'bg-green-200'}`}>
                                {error ? (
                                    <XCircleIcon className="w-5 h-5 text-red-600" />
                                ) : isLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                                ) : (
                                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Información sobre materias */}
                <div className="p-4 md:p-6 border-b border-gray-100">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-green-800 mb-2">Tus Materias Personalizadas</h3>
                                <div className="space-y-2 text-sm text-green-700">
                                    <p><span className="font-medium">🟢 Solo tus materias:</span> Aquí se muestran únicamente las materias que has agregado para tu grado.</p>
                                    <p><span className="font-medium">💾 Datos persistentes:</span> Todas las materias, estudiantes y notas se guardan automáticamente en la base de datos Supabase.</p>
                                    <p className="text-xs text-green-600 mt-2">
                                        Agrega nuevas materias usando el botón "Agregar Materia" y estas se asociarán automáticamente a tu grado ({auth.getCurrentUser()?.grado || 'Sin especificar'}).
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabla de materias */}
                <div className="p-4 md:p-6">
                    {materias.length === 0 ? (
                        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                            <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-lg font-medium text-gray-900">No tienes materias agregadas</h3>
                            <p className="mt-1 text-gray-500">Comienza agregando tu primera materia para el grado {auth.getCurrentUser()?.grado || 'Sin especificar'}</p>
                            <div className="mt-6">
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 mx-auto"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    Agregar Primera Materia
                                </button>
                            </div>
                        </div>
                    ) : (
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
                                        <p className="text-xs">
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Personalizada
                                            </span>
                                        </p>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                        <p className="text-xs text-blue-600 font-medium">
                                            <svg className="w-3 h-3 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            Clic para gestionar notas
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
                                <p className="text-xs text-gray-500 mt-1">
                                    Por defecto se usará tu grado actual: <span className="font-medium text-purple-600">{auth.getCurrentUser()?.grado || 'Sin especificar'}</span>
                                </p>
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