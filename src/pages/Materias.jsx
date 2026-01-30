import { AcademicCapIcon, ArrowLeftIcon, BookOpenIcon, CheckCircleIcon, PencilIcon, PlusIcon, TrashIcon, UserGroupIcon, UserPlusIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import PageContainer from '../components/PageContainer'
import auth from '../utils/auth'
import db from '../utils/database'
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
    const [notasMateria, setNotasMateria] = useState({})
    const [formData, setFormData] = useState({
        nombre: '',
        codigo: '',
        grado: '',
        horario: ''
    })
    const [studentForm, setStudentForm] = useState({
        nombre: ''
    })

    // Estado para indicador de guardado automático
    const [autoSaveStatus, setAutoSaveStatus] = useState('')

    // Estados de loading y errores
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isLoadingNotas, setIsLoadingNotas] = useState(false)
    const [valoresTemporales, setValoresTemporales] = useState({})

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
    const cargarNotasIndividuales = async (materiaId = null) => {
        try {
            setIsLoadingNotas(true);
            console.log('🔄 Cargando notas individuales desde Supabase...');
            const currentUser = auth.getCurrentUser();

            if (!currentUser?.id) {
                console.log('⚠️ No hay usuario autenticado');
                mostrarEstadoGuardado('❌ No hay usuario autenticado');
                return;
            }

            // Obtener TODAS las notas usando paginación
            // Supabase tiene un límite de 1000 registros por defecto
            let notasDB = []
            let desde = 0
            const limite = 1000
            let hayMasRegistros = true

            console.log('🔄 Iniciando carga de notas con paginación...')

            while (hayMasRegistros) {
                // Construir query base
                let query = supabase
                    .from('notas_individuales')
                    .select('*', { count: 'exact' })
                    .eq('usuario_id', currentUser.id)
                    .order('created_at', { ascending: false })
                    .range(desde, desde + limite - 1);

                // Si se especifica una materia, filtrar por ella
                if (materiaId) {
                    query = query.eq('materia_id', materiaId);
                }

                const { data, error, count } = await query;

                if (error) {
                    console.error('❌ Error obteniendo notas individuales:', error);
                    mostrarEstadoGuardado('❌ Error cargando notas desde BD');
                    return;
                }

                if (data && data.length > 0) {
                    notasDB = [...notasDB, ...data]
                    console.log(`📦 Descargadas ${data.length} notas (total acumulado: ${notasDB.length}/${count || '?'})`)

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

            console.log('✅ Carga completa!')
            console.log('📊 Total de notas individuales obtenidas:', notasDB.length);

            // Convertir a formato del estado local
            const notasFormateadas = {};
            const tiposNotaEncontrados = new Set(); // Para rastrear tipos de nota únicos

            notasDB.forEach(nota => {
                const materiaId = nota.materia_id;
                const estudianteId = nota.estudiante_id;
                const periodoKey = `periodo${nota.periodo}`;

                // Agregar tipo de nota a la lista de tipos encontrados
                tiposNotaEncontrados.add({
                    id: nota.tipo_nota_id,
                    titulo: nota.titulo,
                    periodo: nota.periodo
                });

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

            // Actualizar tipos de nota basado en las notas encontradas
            if (materiaId && tiposNotaEncontrados.size > 0) {
                const tiposNotaParaMateria = {};
                tiposNotaEncontrados.forEach(tipo => {
                    if (!tiposNotaParaMateria[tipo.periodo]) {
                        tiposNotaParaMateria[tipo.periodo] = [];
                    }
                    // Evitar duplicados
                    if (!tiposNotaParaMateria[tipo.periodo].find(t => t.id === tipo.id)) {
                        tiposNotaParaMateria[tipo.periodo].push({
                            id: tipo.id,
                            titulo: tipo.titulo
                        });
                    }
                });

                setTiposNotaPeriodo(prev => ({
                    ...prev,
                    [materiaId]: tiposNotaParaMateria
                }));

                console.log('📝 Tipos de nota actualizados desde BD:', tiposNotaParaMateria);
            }

            // Mostrar confirmación de carga exitosa
            const totalNotas = Object.values(notasFormateadas).reduce((acc, materia) => {
                return acc + Object.values(materia).reduce((acc2, estudiante) => {
                    return acc2 + Object.values(estudiante).reduce((acc3, periodo) => acc3 + periodo.length, 0);
                }, 0);
            }, 0);

            const mensaje = materiaId
                ? `✅ ${totalNotas} notas cargadas para esta materia desde BD`
                : `✅ ${totalNotas} notas cargadas desde BD`;
            mostrarEstadoGuardado(mensaje);

        } catch (error) {
            console.error('❌ Error cargando notas individuales:', error);
            mostrarEstadoGuardado('❌ Error cargando notas');
        } finally {
            setIsLoadingNotas(false);
        }
    }

    // Cargar notas desde base de datos para el resumen
    const cargarNotasDesdeBD = async () => {
        try {
            console.log('🔄 Cargando notas desde base de datos...');
            const currentUser = auth.getCurrentUser();

            if (!currentUser?.id) {
                console.error('❌ No hay usuario autenticado');
                alert('No hay usuario autenticado');
                return;
            }

            if (!selectedMateria) {
                alert('Selecciona una materia primero');
                return;
            }

            console.log('👤 Usuario:', currentUser.nombre, 'ID:', currentUser.id);
            console.log('📚 Materia seleccionada:', selectedMateria.nombre, 'ID:', selectedMateria.id);

            // Cargar notas individuales desde Supabase
            const notasIndividuales = await cargarNotasIndividualesDesdeBD(selectedMateria.id);
            console.log('📝 Notas individuales cargadas desde BD:', notasIndividuales);

            if (!notasIndividuales || Object.keys(notasIndividuales).length === 0) {
                console.log('⚠️ No hay notas individuales en la base de datos');
                return;
            }

            // Actualizar el estado con las notas individuales
            setNotas(prev => ({
                ...prev,
                [selectedMateria.id]: notasIndividuales
            }));
            console.log('✅ Notas individuales cargadas desde BD:', notasIndividuales);

            // Mostrar estructura de datos para debug
            console.log('📋 Estructura de notas cargadas:');
            Object.keys(notasIndividuales).forEach(estudianteId => {
                console.log(`👤 Estudiante ${estudianteId}:`, notasIndividuales[estudianteId]);
                Object.keys(notasIndividuales[estudianteId]).forEach(periodo => {
                    console.log(`📅 ${periodo}:`, notasIndividuales[estudianteId][periodo]);
                });
            });

            // Contar el total de notas cargadas
            let totalNotas = 0;
            Object.values(notasIndividuales).forEach(estudianteNotas => {
                Object.values(estudianteNotas).forEach(periodoNotas => {
                    if (Array.isArray(periodoNotas)) {
                        totalNotas += periodoNotas.length;
                    }
                });
            });

            // Mostrar mensaje de éxito
            const mensaje = `✅ ${totalNotas} notas cargadas desde BD para ${selectedMateria.nombre}`;
            mostrarEstadoGuardado(mensaje);

        } catch (error) {
            console.error('❌ Error cargando notas desde BD:', error);
            alert(`Error cargando notas: ${error.message}`);
            setAutoSaveStatus('❌ Error cargando notas desde BD');
            setTimeout(() => setAutoSaveStatus(''), 3000);
        }
    }

    // Función para agregar notas de prueba
    const agregarNotasPrueba = () => {
        if (!selectedMateria) {
            alert('Selecciona una materia primero');
            return;
        }

        if (estudiantes.length === 0) {
            alert('No hay estudiantes registrados');
            return;
        }

        // Crear algunas notas de prueba
        const nuevasNotas = { ...notasMateria };

        estudiantes.slice(0, 3).forEach((estudiante, index) => {
            const estudianteId = estudiante.id;
            const periodoKey = `periodo${selectedPeriodo}`;

            if (!nuevasNotas[estudianteId]) {
                nuevasNotas[estudianteId] = {};
            }
            if (!nuevasNotas[estudianteId][periodoKey]) {
                nuevasNotas[estudianteId][periodoKey] = [];
            }

            // Agregar notas de prueba
            const notasPrueba = [
                { id: `prueba-${estudianteId}-1`, tipoNotaId: 'quiz', titulo: 'Quiz', valor: 3.5 + index * 0.5 },
                { id: `prueba-${estudianteId}-2`, tipoNotaId: 'tarea', titulo: 'Tarea', valor: 4.0 + index * 0.2 },
                { id: `prueba-${estudianteId}-3`, tipoNotaId: 'examen', titulo: 'Examen', valor: 3.8 + index * 0.3 }
            ];

            nuevasNotas[estudianteId][periodoKey] = notasPrueba;
        });

        // También agregar tipos de nota de prueba
        const nuevosTiposNota = { ...tiposNotaPeriodo };
        if (!nuevosTiposNota[selectedMateria.id]) {
            nuevosTiposNota[selectedMateria.id] = {};
        }
        if (!nuevosTiposNota[selectedMateria.id][selectedPeriodo]) {
            nuevosTiposNota[selectedMateria.id][selectedPeriodo] = [];
        }

        const tiposPrueba = [
            { id: 'quiz', titulo: 'Quiz', descripcion: 'Evaluación rápida' },
            { id: 'tarea', titulo: 'Tarea', descripcion: 'Trabajo en casa' },
            { id: 'examen', titulo: 'Examen', descripcion: 'Evaluación formal' }
        ];

        nuevosTiposNota[selectedMateria.id][selectedPeriodo] = tiposPrueba;
        setTiposNotaPeriodo(nuevosTiposNota);

        setNotasMateria(nuevasNotas);
        console.log('✅ Notas de prueba agregadas:', nuevasNotas);
        console.log('✅ Tipos de nota agregados:', nuevosTiposNota);

        setAutoSaveStatus('✅ Notas y tipos de prueba agregados');
        setTimeout(() => setAutoSaveStatus(''), 3000);
    }

    const cargarPeriodosAcademicos = async () => {
        try {
            const periodos = await db.getPeriodosAcademicos()

            // Formatear periodos con información adicional
            const periodosFormateados = {}
            Object.keys(periodos).forEach(numero => {
                const p = periodos[numero]
                if (p.fechaInicio && p.fechaFin) {
                    periodosFormateados[numero] = {
                        nombre: `Período ${numero}`,
                        fechaInicio: p.fechaInicio,
                        fechaFin: p.fechaFin,
                        descripcion: formatearDescripcionPeriodo(p.fechaInicio, p.fechaFin)
                    }
                }
            })

            if (Object.keys(periodosFormateados).length > 0) {
                setPeriodosAcademicos(periodosFormateados)
                console.log('✅ Períodos académicos cargados:', periodosFormateados)
            }
        } catch (error) {
            console.error('❌ Error cargando períodos académicos:', error)
        }
    }

    // Función auxiliar para formatear descripción de período
    const formatearDescripcionPeriodo = (fechaInicio, fechaFin) => {
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
        const inicio = new Date(fechaInicio + 'T00:00:00')
        const fin = new Date(fechaFin + 'T00:00:00')
        return `${inicio.getDate()} ${meses[inicio.getMonth()]} - ${fin.getDate()} ${meses[fin.getMonth()]}`
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
            // Ordenar estudiantes alfabéticamente por nombre
            setEstudiantes(estudiantesUsuario.sort((a, b) => {
                return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
            }))

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
        await cargarNotasIndividuales(materia.id)

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

    // Función para eliminar estudiante
    const handleDeleteStudent = async (estudianteId) => {
        const estudiante = estudiantes.find(est => est.id === estudianteId)

        if (!estudiante) {
            mostrarEstadoGuardado('❌ Estudiante no encontrado')
            return
        }

        const confirmar = confirm(`¿Estás seguro de que quieres eliminar a ${estudiante.nombre}?\n\nEsto eliminará todas sus asistencias y notas de la base de datos.`)

        if (!confirmar) {
            return
        }

        try {
            // Eliminar de la base de datos
            await db.eliminarEstudiante(estudianteId)

            // Actualizar lista local
            setEstudiantes(prev => prev.filter(est => est.id !== estudianteId))

            mostrarEstadoGuardado(`✅ ${estudiante.nombre} eliminado correctamente`)
        } catch (error) {
            console.error('❌ Error eliminando estudiante:', error)
            mostrarEstadoGuardado(`❌ Error al eliminar: ${error.message}`)
        }
    }

    // Función para generar código automático secuencial
    const generarCodigoAutomatico = () => {
        const numeros = estudiantes
            .map(est => {
                const match = est.codigo.match(/\d+/)
                return match ? parseInt(match[0]) : 0
            })
            .filter(num => !isNaN(num))

        const maxNumero = numeros.length > 0 ? Math.max(...numeros) : 0
        const siguienteNumero = maxNumero + 1
        return siguienteNumero.toString().padStart(3, '0')
    }

    const handleAddStudent = async () => {
        if (!studentForm.nombre.trim()) {
            mostrarEstadoGuardado('❌ Por favor ingresa el nombre del estudiante')
            return
        }

        try {
            // Generar código automáticamente
            const codigoAutomatico = generarCodigoAutomatico()

            const nuevoEstudiante = {
                nombre: studentForm.nombre.trim(),
                codigo: codigoAutomatico,
                grado: auth.getCurrentUser()?.grado || 'Sin especificar'
            }

            // Actualizar estado local primero para respuesta inmediata
            const estudianteTemporal = {
                id: Date.now(),
                ...nuevoEstudiante,
                created_at: new Date().toISOString()
            }

            setEstudiantes(prev => [...prev, estudianteTemporal].sort((a, b) => {
                return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
            }))
            setStudentForm({ nombre: '' })
            setShowAddStudentModal(false)

            // Guardar en la base de datos en segundo plano
            setTimeout(async () => {
                try {
                    const estudianteGuardado = await db.guardarEstudiante(nuevoEstudiante)
                    console.log('✅ Estudiante guardado:', estudianteGuardado)
                    mostrarEstadoGuardado(`✅ ${estudianteGuardado.nombre} agregado (${estudianteGuardado.codigo})`)
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
        console.log('🎯 Procesando nota:', { estudianteId, tipoNotaId, valor, materia: selectedMateria?.id, periodo: selectedPeriodo });

        try {
            // Validaciones básicas
            if (!selectedMateria?.id || !estudianteId || !tipoNotaId) {
                mostrarEstadoGuardado('❌ Error: Datos incompletos');
                return;
            }

            // Si el valor está vacío, borrar la nota
            if (valor === '' || valor === null || valor === undefined) {
                console.log('🗑️ Valor vacío - eliminando nota');
                await borrarNotaIndividual(estudianteId, tipoNotaId);
                return;
            }

            // Limpiar y validar el valor
            const valorLimpio = valor.toString().replace(',', '.');
            const nota = parseFloat(valorLimpio);

            if (isNaN(nota) || nota < 1.0 || nota > 5.0) {
                mostrarEstadoGuardado('❌ Nota inválida. Debe estar entre 1.0 y 5.0');
                return;
            }

            // Buscar el tipo de nota
            const tiposManuales = tiposNotaPeriodo[selectedMateria.id]?.[selectedPeriodo] || [];
            const tiposExistentes = obtenerTiposNotaExistentes();
            const tipoNota = [...tiposManuales, ...tiposExistentes].find(t => t.id === tipoNotaId);

            if (!tipoNota) {
                mostrarEstadoGuardado('❌ Error: Tipo de nota no encontrado');
                return;
            }

            // Verificar si ya existe la nota para determinar si es actualización o creación
            const periodoKey = `periodo${selectedPeriodo}`;
            const notaExistente = notas[selectedMateria.id]?.[estudianteId]?.[periodoKey]?.find(n => n.tipoId === tipoNotaId);
            const esActualizacion = !!notaExistente;

            console.log(`🔄 ${esActualizacion ? 'Actualizando' : 'Creando'} nota:`, {
                tipo: tipoNota.titulo,
                valor: nota,
                existente: esActualizacion
            });

            // Guardar/actualizar en la base de datos usando UPSERT
            const safeTipoNotaId = parseInt(tipoNotaId);
            const resultado = await db.guardarNotaIndividual(
                selectedMateria.id,
                estudianteId,
                selectedPeriodo,
                safeTipoNotaId,
                tipoNota.titulo,
                nota
            );

            console.log('📊 Resultado del guardado:', resultado);

            // Actualizar estado local después del guardado exitoso
            setNotas(prev => {
                const nuevasNotas = { ...prev };

                if (!nuevasNotas[selectedMateria.id]) nuevasNotas[selectedMateria.id] = {};
                if (!nuevasNotas[selectedMateria.id][estudianteId]) nuevasNotas[selectedMateria.id][estudianteId] = {};
                if (!nuevasNotas[selectedMateria.id][estudianteId][periodoKey]) nuevasNotas[selectedMateria.id][estudianteId][periodoKey] = [];

                // Buscar si ya existe la nota en el estado local
                const notaExistenteLocal = nuevasNotas[selectedMateria.id][estudianteId][periodoKey].find(n => n.tipoId === tipoNotaId);

                if (notaExistenteLocal) {
                    // Actualizar nota existente
                    notaExistenteLocal.valor = nota;
                    notaExistenteLocal.updated_at = new Date().toISOString();
                    console.log('📝 Nota actualizada en estado local:', notaExistenteLocal);
                } else {
                    // Crear nueva nota
                    const nuevaNota = {
                        id: resultado?.id || Math.floor(Math.random() * 10000) + estudianteId,
                        tipoId: tipoNotaId,
                        titulo: tipoNota.titulo,
                        valor: nota,
                        fecha: new Date().toISOString().split('T')[0],
                        created_at: new Date().toISOString()
                    };
                    nuevasNotas[selectedMateria.id][estudianteId][periodoKey].push(nuevaNota);
                    console.log('📝 Nueva nota creada en estado local:', nuevaNota);
                }

                return nuevasNotas;
            });

            // Mostrar mensaje de éxito específico
            const mensaje = esActualizacion
                ? `✅ ${tipoNota.titulo} = ${nota} actualizado`
                : `✅ ${tipoNota.titulo} = ${nota} creado`;

            mostrarEstadoGuardado(mensaje);
            console.log(`✅ Operación completada: ${mensaje}`);

        } catch (error) {
            console.error('❌ Error procesando nota:', error);
            mostrarEstadoGuardado(`❌ Error al procesar: ${error.message}`);
        }
    }

    const borrarNotaIndividual = async (estudianteId, tipoNotaId) => {
        console.log('🗑️ Eliminando nota:', { estudianteId, tipoNotaId, materia: selectedMateria?.id, periodo: selectedPeriodo });

        try {
            // Validaciones básicas
            if (!selectedMateria?.id || !estudianteId || !tipoNotaId) {
                mostrarEstadoGuardado('❌ Error: Datos incompletos para eliminar');
                return;
            }

            // Buscar el tipo de nota
            const tiposManuales = tiposNotaPeriodo[selectedMateria.id]?.[selectedPeriodo] || [];
            const tiposExistentes = obtenerTiposNotaExistentes();
            const tipoNota = [...tiposManuales, ...tiposExistentes].find(t => t.id === tipoNotaId);

            if (!tipoNota) {
                console.log('⚠️ Tipo de nota no encontrado para eliminar');
                mostrarEstadoGuardado('⚠️ Tipo de nota no encontrado');
                return;
            }

            const periodoKey = `periodo${selectedPeriodo}`;
            const notaExistente = notas[selectedMateria.id]?.[estudianteId]?.[periodoKey]?.find(n => n.tipoId === tipoNotaId);

            console.log('🔍 Nota a eliminar:', {
                tipo: tipoNota.titulo,
                existe: !!notaExistente,
                id: notaExistente?.id
            });

            // Eliminar de la base de datos
            if (notaExistente && notaExistente.id) {
                console.log('🔄 Eliminando nota existente por ID:', notaExistente.id);
                await db.eliminarNotaIndividualPorId(notaExistente.id);
            } else {
                console.log('🔄 Eliminando nota por parámetros (no se encontró ID)');
                await db.eliminarNotaIndividual(
                    selectedMateria.id,
                    estudianteId,
                    selectedPeriodo,
                    tipoNotaId
                );
            }

            console.log('✅ Nota eliminada de la base de datos');

            // Actualizar estado local
            setNotas(prev => {
                const nuevasNotas = { ...prev };

                if (nuevasNotas[selectedMateria.id]?.[estudianteId]?.[periodoKey]) {
                    const notasAntes = nuevasNotas[selectedMateria.id][estudianteId][periodoKey].length;
                    // Filtrar la nota específica
                    nuevasNotas[selectedMateria.id][estudianteId][periodoKey] =
                        nuevasNotas[selectedMateria.id][estudianteId][periodoKey].filter(n => n.tipoId !== tipoNotaId);
                    const notasDespues = nuevasNotas[selectedMateria.id][estudianteId][periodoKey].length;

                    console.log(`📊 Estado local actualizado: ${notasAntes} → ${notasDespues} notas`);
                } else {
                    console.log('📊 No había notas para este estudiante/período');
                }

                return nuevasNotas;
            });

            // Mostrar confirmación
            mostrarEstadoGuardado(`✅ Eliminado: ${tipoNota.titulo}`);
            console.log(`✅ Nota eliminada exitosamente: ${tipoNota.titulo}`);

        } catch (error) {
            console.error('❌ Error eliminando nota:', error);
            mostrarEstadoGuardado(`❌ Error al eliminar: ${error.message}`);
        }
    }

    const obtenerNotaPorTipo = (estudianteId, tipoNotaId) => {
        if (!selectedMateria || !notas[selectedMateria.id] || !notas[selectedMateria.id][estudianteId]) {
            return ''
        }

        const periodoKey = `periodo${selectedPeriodo}`
        const notasPeriodo = notas[selectedMateria.id][estudianteId][periodoKey] || []
        const nota = notasPeriodo.find(n => n.tipoId === tipoNotaId)

        return nota ? nota.valor : ''
    }

    // Función para obtener todos los tipos de nota únicos de las notas existentes
    const obtenerTiposNotaExistentes = () => {
        if (!selectedMateria || !notas[selectedMateria.id]) {
            return []
        }

        const tiposNotaUnicos = new Map()
        const periodoKey = `periodo${selectedPeriodo}`

        // Recorrer todas las notas de la materia para el período actual
        Object.values(notas[selectedMateria.id]).forEach(estudianteNotas => {
            const notasPeriodo = estudianteNotas[periodoKey] || []
            notasPeriodo.forEach(nota => {
                if (!tiposNotaUnicos.has(nota.tipoId)) {
                    tiposNotaUnicos.set(nota.tipoId, {
                        id: nota.tipoId,
                        titulo: nota.titulo
                    })
                }
            })
        })

        return Array.from(tiposNotaUnicos.values())
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
        console.log('🗑️ Eliminando tipo de nota:', { tipoNotaId, materia: selectedMateria?.id, periodo: selectedPeriodo });

        try {
            // Buscar el tipo de nota para obtener su información
            const tiposManuales = tiposNotaPeriodo[selectedMateria.id]?.[selectedPeriodo] || [];
            const tiposExistentes = obtenerTiposNotaExistentes();
            const tipoNota = [...tiposManuales, ...tiposExistentes].find(t => t.id === tipoNotaId);

            if (!tipoNota) {
                mostrarEstadoGuardado('❌ Error: Tipo de nota no encontrado');
                return;
            }

            // Confirmar eliminación
            const confirmar = confirm(`¿Estás seguro de que quieres eliminar la columna "${tipoNota.titulo}"?\n\nEsto eliminará TODAS las notas de este tipo para todos los estudiantes en el período ${selectedPeriodo}.`);

            if (!confirmar) {
                console.log('❌ Eliminación cancelada por el usuario');
                return;
            }

            console.log('🔄 Eliminando tipo de nota y todas sus notas relacionadas...');

            // 1. Eliminar todas las notas relacionadas con este tipo de la base de datos
            const estudiantes = Object.keys(notas[selectedMateria.id] || {});
            let notasEliminadas = 0;

            for (const estudianteId of estudiantes) {
                try {
                    await db.eliminarNotaIndividual(
                        selectedMateria.id,
                        estudianteId,
                        selectedPeriodo,
                        tipoNotaId
                    );
                    notasEliminadas++;
                } catch (error) {
                    console.error(`Error eliminando nota para estudiante ${estudianteId}:`, error);
                }
            }

            console.log(`✅ ${notasEliminadas} notas eliminadas de la base de datos`);

            // 2. Eliminar el tipo de nota del estado local
            setTiposNotaPeriodo(prev => ({
                ...prev,
                [selectedMateria.id]: {
                    ...prev[selectedMateria.id],
                    [selectedPeriodo]: prev[selectedMateria.id]?.[selectedPeriodo]?.filter(t => t.id !== tipoNotaId) || []
                }
            }));

            // 3. Eliminar todas las notas asociadas del estado local
            setNotas(prev => {
                const nuevasNotas = { ...prev };
                if (nuevasNotas[selectedMateria.id]) {
                    Object.keys(nuevasNotas[selectedMateria.id]).forEach(estudianteId => {
                        const periodoKey = `periodo${selectedPeriodo}`;
                        if (nuevasNotas[selectedMateria.id][estudianteId]?.[periodoKey]) {
                            nuevasNotas[selectedMateria.id][estudianteId][periodoKey] =
                                nuevasNotas[selectedMateria.id][estudianteId][periodoKey].filter(n => n.tipoId !== tipoNotaId);
                        }
                    });
                }
                return nuevasNotas;
            });

            // 4. Mostrar confirmación
            mostrarEstadoGuardado(`✅ Columna "${tipoNota.titulo}" eliminada (${notasEliminadas} notas)`);
            console.log(`✅ Tipo de nota eliminado: ${tipoNota.titulo}`);

        } catch (error) {
            console.error('❌ Error eliminando tipo de nota:', error);
            mostrarEstadoGuardado(`❌ Error al eliminar columna: ${error.message}`);
        }
    }

    const calcularPromedioPeriodo = (estudianteId, periodo) => {
        if (!selectedMateria || !notas[selectedMateria.id] || !notas[selectedMateria.id][estudianteId]) {
            return 0
        }

        const periodoKey = `periodo${periodo}`
        const notasPeriodo = notas[selectedMateria.id][estudianteId][periodoKey] || []
        if (notasPeriodo.length === 0) return 0
        const suma = notasPeriodo.reduce((acc, nota) => acc + parseFloat(nota.valor), 0)
        return Math.round((suma / notasPeriodo.length) * 100) / 100
    }

    const calcularPromedio = (estudianteId) => {
        const promedios = [1, 2, 3, 4].map(periodo => calcularPromedioPeriodo(estudianteId, periodo))
        const promedioGeneral = promedios.reduce((acc, prom) => acc + prom, 0) / 4
        return Math.round(promedioGeneral * 100) / 100
    }

    const getEstadoNota = (promedio) => {
        const prom = parseFloat(promedio)
        if (prom >= 3.5) return 'bg-green-100 text-green-800'
        if (prom >= 3.0) return 'bg-yellow-100 text-yellow-800'
        return 'bg-red-100 text-red-800'
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
        console.log('📊 Iniciando exportación de notas a Excel...')

        if (!selectedMateria) {
            alert('Selecciona una materia primero')
            return
        }

        console.log('📚 Materia seleccionada:', selectedMateria.nombre)
        console.log('📅 Período seleccionado:', selectedPeriodo)
        console.log('👥 Total de estudiantes:', estudiantes.length)
        console.log('📝 Estado de notas:', notas[selectedMateria.id])

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
        // IMPORTANTE: Usar obtenerTiposNotaExistentes() que lee de las notas reales en BD
        const tiposManuales = tiposNotaPeriodo[selectedMateria.id]?.[selectedPeriodo] || []
        const tiposExistentes = obtenerTiposNotaExistentes()

        // Combinar tipos manuales y existentes evitando duplicados
        const tiposCombinados = new Map()
        tiposManuales.forEach(tipo => tiposCombinados.set(tipo.id, tipo))
        tiposExistentes.forEach(tipo => {
            if (!tiposCombinados.has(tipo.id)) {
                tiposCombinados.set(tipo.id, tipo)
            }
        })

        const tiposActividad = Array.from(tiposCombinados.values())
        const nombresPeriodos = Object.values(periodosAcademicos).map(p => `${p.nombre} (${p.descripcion})`)

        console.log('📋 Tipos manuales:', tiposManuales.length, tiposManuales)
        console.log('📋 Tipos existentes:', tiposExistentes.length, tiposExistentes)
        console.log('📋 Tipos de actividad COMBINADOS:', tiposActividad.length)
        console.log('📋 Actividades finales:', tiposActividad)

        if (tiposActividad.length > 0) {
            // Encabezados para actividades específicas
            const encabezados = ['Estudiante']

            // Agregar cada actividad como columna individual
            tiposActividad.forEach((tipo, index) => {
                const titulo = tipo.titulo || tipo.descripcion || `Actividad ${index + 1}`
                console.log(`  📝 Columna ${index + 1}: "${titulo}" (ID: ${tipo.id})`)
                encabezados.push(titulo)
            })

            // Agregar columna de promedio
            encabezados.push(`Promedio`)

            datosHoja.push(encabezados)
            console.log('📋 Encabezados completos:', encabezados)
            console.log('📋 Total de columnas:', encabezados.length)

            // Datos de estudiantes
            console.log('🔄 Procesando estudiantes...')
            let estudiantesExportados = 0

            estudiantes.forEach((estudiante, index) => {
                const fila = [estudiante.nombre]

                console.log(`👤 Estudiante ${index + 1}/${estudiantes.length}: ${estudiante.nombre} (ID: ${estudiante.id})`)

                // Verificar si el estudiante tiene notas para esta materia
                const tieneNotas = notas[selectedMateria.id]?.[estudiante.id]
                console.log(`  🔍 Tiene notas en estado:`, !!tieneNotas)
                if (tieneNotas) {
                    console.log(`  📚 Períodos disponibles:`, Object.keys(tieneNotas))
                }

                // Agregar nota de cada actividad
                tiposActividad.forEach((tipo, tipoIndex) => {
                    const nota = obtenerNotaPorTipo(estudiante.id, tipo.id)
                    const titulo = tipo.titulo || tipo.descripcion || `Actividad ${tipoIndex + 1}`
                    console.log(`  📝 ${titulo} (ID: ${tipo.id}): ${nota || 'sin nota'}`)
                    fila.push(nota || '')
                })

                // Promedio del período
                const promedio = calcularPromedioPeriodo(estudiante.id, selectedPeriodo)
                console.log(`  📊 Promedio período ${selectedPeriodo}: ${promedio}`)
                fila.push(promedio || 0)

                datosHoja.push(fila)
                estudiantesExportados++
                console.log(`  ✅ Fila con ${fila.length} columnas agregada (total filas: ${datosHoja.length})`)
            })

            console.log(`✅ Total de estudiantes exportados: ${estudiantesExportados}`)
        } else {
            console.log('⚠️ No hay actividades específicas, exportando promedios por período')
            // Si no hay actividades, mostrar solo promedios por período
            const encabezados = ['Estudiante',
                ...Object.values(periodosAcademicos).map(p => `${p.nombre} (${p.descripcion})`),
                'Promedio General'
            ]
            datosHoja.push(encabezados)
            console.log('📋 Encabezados:', encabezados)

            console.log('🔄 Procesando estudiantes...')
            let estudiantesExportados = 0

            estudiantes.forEach((estudiante, index) => {
                console.log(`👤 Estudiante ${index + 1}/${estudiantes.length}: ${estudiante.nombre} (ID: ${estudiante.id})`)

                const fila = [
                    estudiante.nombre,
                    calcularPromedioPeriodo(estudiante.id, 1),
                    calcularPromedioPeriodo(estudiante.id, 2),
                    calcularPromedioPeriodo(estudiante.id, 3),
                    calcularPromedioPeriodo(estudiante.id, 4),
                    calcularPromedio(estudiante.id)
                ]

                console.log(`  📊 Promedios: P1=${fila[1]}, P2=${fila[2]}, P3=${fila[3]}, P4=${fila[4]}, General=${fila[5]}`)

                datosHoja.push(fila)
                estudiantesExportados++
                console.log(`  ✅ Fila agregada (total filas: ${datosHoja.length})`)
            })

            console.log(`✅ Total de estudiantes exportados: ${estudiantesExportados}`)
        }

        console.log('📊 Total de filas en la hoja:', datosHoja.length)
        console.log('📋 Contenido completo de datosHoja:')
        datosHoja.forEach((fila, index) => {
            console.log(`  Fila ${index}:`, fila)
        })

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

        const nombreArchivo = `Notas_${selectedMateria.nombre}_${nombresPeriodos[selectedPeriodo - 1]}.xlsx`
        XLSX.writeFile(wb, nombreArchivo)

        console.log('✅ Excel exportado correctamente')
        console.log(`📁 Nombre del archivo: ${nombreArchivo}`)

        const totalEstudiantes = estudiantes.length
        const filasExportadas = datosHoja.length - 7 // Restar encabezados institucionales (6) + encabezado de tabla (1)

        alert(`✅ ¡Exportación completada!\n\n` +
            `📚 Materia: ${selectedMateria.nombre}\n` +
            `📅 Período: ${nombresPeriodos[selectedPeriodo - 1]}\n` +
            `👥 Total estudiantes: ${totalEstudiantes}\n` +
            `📊 Filas exportadas: ${filasExportadas}\n` +
            `📋 Actividades: ${tiposActividad.length}\n\n` +
            `Archivo: ${nombreArchivo}`)
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
                                    onChange={async (e) => {
                                        const nuevoPeriodo = parseInt(e.target.value);
                                        setSelectedPeriodo(nuevoPeriodo);
                                        // Recargar notas para el nuevo período
                                        if (selectedMateria) {
                                            await cargarNotasIndividuales(selectedMateria.id);
                                        }
                                    }}
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
                                    <div className={`px-3 py-2 rounded-lg text-sm font-medium border animate-pulse ${autoSaveStatus.includes('✅')
                                        ? 'bg-green-100 text-green-800 border-green-200'
                                        : autoSaveStatus.includes('❌')
                                            ? 'bg-red-100 text-red-800 border-red-200'
                                            : 'bg-blue-100 text-blue-800 border-blue-200'
                                        }`}>
                                        <div className="flex items-center gap-2">
                                            {autoSaveStatus.includes('✅') && <span>✅</span>}
                                            {autoSaveStatus.includes('❌') && <span>❌</span>}
                                            <span>{autoSaveStatus}</span>
                                        </div>
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
                        {/* Botones para cargar notas */}
                        <div className="mb-4 flex justify-end gap-2">
                            <button
                                onClick={agregarNotasPrueba}
                                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 text-sm font-medium"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Agregar Notas Prueba
                            </button>
                            <button
                                onClick={async () => {
                                    if (selectedMateria) {
                                        await cargarNotasIndividuales(selectedMateria.id);
                                    } else {
                                        await cargarNotasIndividuales();
                                    }
                                }}
                                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 text-sm font-medium"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Recargar Notas desde BD
                            </button>
                        </div>

                        {/* Tabla de notas - Siempre visible */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            {isLoadingNotas && (
                                <div className="bg-blue-50 border-b border-blue-200 p-3">
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                        <span className="text-blue-700 text-sm font-medium">Cargando notas desde la base de datos...</span>
                                    </div>
                                </div>
                            )}

                            {/* Mensaje cuando no hay columnas de notas */}
                            {(() => {
                                const tiposManuales = tiposNotaPeriodo[selectedMateria.id]?.[selectedPeriodo] || []
                                const tiposExistentes = obtenerTiposNotaExistentes()
                                const tieneNotas = tiposManuales.length > 0 || tiposExistentes.length > 0

                                if (!tieneNotas) {
                                    return (
                                        <div className="bg-yellow-50 border-b border-yellow-200 p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <BookOpenIcon className="h-5 w-5 text-yellow-600 mr-2" />
                                                    <span className="text-yellow-700 text-sm font-medium">
                                                        No hay notas para el Período {selectedPeriodo}. Agrega la primera columna de notas.
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => setShowAddTipoNotaModal(true)}
                                                    className="bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1 text-sm"
                                                >
                                                    <PlusIcon className="w-4 h-4" />
                                                    Agregar Columna
                                                </button>
                                            </div>
                                        </div>
                                    )
                                }
                                return null
                            })()}

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
                                            {(() => {
                                                // Combinar tipos de nota creados manualmente con tipos de nota existentes en las notas
                                                const tiposManuales = tiposNotaPeriodo[selectedMateria.id]?.[selectedPeriodo] || []
                                                const tiposExistentes = obtenerTiposNotaExistentes()

                                                // Crear un mapa para evitar duplicados
                                                const tiposCombinados = new Map()

                                                // Agregar tipos manuales primero
                                                tiposManuales.forEach(tipo => {
                                                    tiposCombinados.set(tipo.id, tipo)
                                                })

                                                // Agregar tipos existentes que no estén en los manuales
                                                tiposExistentes.forEach(tipo => {
                                                    if (!tiposCombinados.has(tipo.id)) {
                                                        tiposCombinados.set(tipo.id, tipo)
                                                    }
                                                })

                                                return Array.from(tiposCombinados.values()).map((tipo) => (
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
                                                ))
                                            })()}
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Promedio
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Estado
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Acciones
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
                                                    {(() => {
                                                        // Usar la misma lógica para obtener tipos combinados
                                                        const tiposManuales = tiposNotaPeriodo[selectedMateria.id]?.[selectedPeriodo] || []
                                                        const tiposExistentes = obtenerTiposNotaExistentes()

                                                        const tiposCombinados = new Map()
                                                        tiposManuales.forEach(tipo => tiposCombinados.set(tipo.id, tipo))
                                                        tiposExistentes.forEach(tipo => {
                                                            if (!tiposCombinados.has(tipo.id)) {
                                                                tiposCombinados.set(tipo.id, tipo)
                                                            }
                                                        })

                                                        return Array.from(tiposCombinados.values()).map((tipo) => {
                                                            const notaActual = obtenerNotaPorTipo(estudiante.id, tipo.id)
                                                            const claveTemporal = `${estudiante.id}-${tipo.id}`
                                                            const valorTemporal = valoresTemporales[claveTemporal] !== undefined ? valoresTemporales[claveTemporal] : notaActual

                                                            return (
                                                                <td key={tipo.id} className="px-3 py-4 whitespace-nowrap text-center">
                                                                    <input
                                                                        type="text"
                                                                        value={valorTemporal}
                                                                        onChange={(e) => {
                                                                            const valor = e.target.value;
                                                                            console.log('🔄 Cambio detectado:', valor, 'para estudiante', estudiante.id, 'tipo', tipo.id);

                                                                            // Actualizar valor temporal
                                                                            setValoresTemporales(prev => ({
                                                                                ...prev,
                                                                                [claveTemporal]: valor
                                                                            }))
                                                                        }}
                                                                        onBlur={async (e) => {
                                                                            console.log('👁️ Input perdió foco');
                                                                            const valor = e.target.value;
                                                                            const input = e.target;

                                                                            // Limpiar valor temporal
                                                                            setValoresTemporales(prev => {
                                                                                const nuevos = { ...prev }
                                                                                delete nuevos[claveTemporal]
                                                                                return nuevos
                                                                            })

                                                                            // Validar y guardar
                                                                            if (valor !== '') {
                                                                                const valorLimpio = valor.replace(',', '.');
                                                                                const nota = parseFloat(valorLimpio);

                                                                                if (isNaN(nota) || nota < 1.0 || nota > 5.0) {
                                                                                    // Mostrar error y limpiar
                                                                                    mostrarEstadoGuardado('❌ Nota inválida. Debe estar entre 1.0 y 5.0');
                                                                                    input.style.backgroundColor = '#fef2f2'; // rojo claro
                                                                                    input.style.borderColor = '#ef4444';
                                                                                    setTimeout(() => {
                                                                                        input.style.backgroundColor = '';
                                                                                        input.style.borderColor = '';
                                                                                    }, 2000);
                                                                                    return;
                                                                                }

                                                                                // Mostrar indicador de guardado
                                                                                input.style.backgroundColor = '#fef3c7'; // amarillo claro
                                                                                input.style.borderColor = '#f59e0b';

                                                                                try {
                                                                                    // Guardar nota válida
                                                                                    await agregarNotaIndividual(estudiante.id, tipo.id, valor);

                                                                                    // Mostrar feedback de éxito
                                                                                    input.style.backgroundColor = '#dcfce7'; // verde claro
                                                                                    input.style.borderColor = '#22c55e';
                                                                                    setTimeout(() => {
                                                                                        input.style.backgroundColor = '';
                                                                                        input.style.borderColor = '';
                                                                                    }, 1500);
                                                                                } catch (error) {
                                                                                    // Mostrar feedback de error
                                                                                    input.style.backgroundColor = '#fef2f2'; // rojo claro
                                                                                    input.style.borderColor = '#ef4444';
                                                                                    setTimeout(() => {
                                                                                        input.style.backgroundColor = '';
                                                                                        input.style.borderColor = '';
                                                                                    }, 2000);
                                                                                }
                                                                            } else {
                                                                                // Borrar nota si está vacía
                                                                                try {
                                                                                    await borrarNotaIndividual(estudiante.id, tipo.id);

                                                                                    // Mostrar feedback de eliminación
                                                                                    input.style.backgroundColor = '#f3f4f6'; // gris claro
                                                                                    input.style.borderColor = '#6b7280';
                                                                                    setTimeout(() => {
                                                                                        input.style.backgroundColor = '';
                                                                                        input.style.borderColor = '';
                                                                                    }, 1000);
                                                                                } catch (error) {
                                                                                    console.error('Error eliminando nota:', error);
                                                                                    // Mostrar feedback de error
                                                                                    input.style.backgroundColor = '#fef2f2'; // rojo claro
                                                                                    input.style.borderColor = '#ef4444';
                                                                                    setTimeout(() => {
                                                                                        input.style.backgroundColor = '';
                                                                                        input.style.borderColor = '';
                                                                                    }, 2000);
                                                                                }
                                                                            }
                                                                        }}
                                                                        onKeyDown={(e) => {
                                                                            // Permitir teclas de navegación y edición
                                                                            const allowedKeys = [
                                                                                'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
                                                                                'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                                                                                'Home', 'End'
                                                                            ];

                                                                            // Permitir números, punto y coma
                                                                            if (allowedKeys.includes(e.key) ||
                                                                                (e.key >= '0' && e.key <= '9') ||
                                                                                e.key === '.' ||
                                                                                e.key === ',') {
                                                                                return;
                                                                            }

                                                                            // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                                                                            if (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
                                                                                return;
                                                                            }

                                                                            e.preventDefault();
                                                                        }}
                                                                        className="w-16 p-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                        placeholder="1.0"
                                                                        inputMode="decimal"
                                                                    />
                                                                </td>
                                                            )
                                                        })
                                                    })()}
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
                                                    <td className="px-4 py-4 whitespace-nowrap text-center">
                                                        <button
                                                            onClick={() => handleDeleteStudent(estudiante.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Eliminar estudiante"
                                                        >
                                                            <TrashIcon className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Resumen de Estudiantes */}
                    <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-semibold text-green-800 flex items-center">
                                <UserGroupIcon className="h-5 w-5 text-green-600 mr-2" />
                                Resumen de Estudiantes - Período {selectedPeriodo}
                            </h4>
                            <div className="text-sm text-green-600">
                                Total: {estudiantes.length} estudiantes
                            </div>
                        </div>

                        {/* Estadísticas por estado */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-green-100 border border-green-200 rounded-lg p-4 text-center">
                                <div className="text-green-800 font-bold text-2xl">
                                    {estudiantes.filter(est => calcularPromedioPeriodo(est.id, selectedPeriodo) >= 3.5).length}
                                </div>
                                <div className="text-green-600 text-sm">Aprobados</div>
                                <div className="text-green-500 text-xs">
                                    ({estudiantes.length > 0 ? Math.round((estudiantes.filter(est => calcularPromedioPeriodo(est.id, selectedPeriodo) >= 3.5).length / estudiantes.length) * 100) : 0}%)
                                </div>
                            </div>
                            <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-4 text-center">
                                <div className="text-yellow-800 font-bold text-2xl">
                                    {estudiantes.filter(est => {
                                        const prom = calcularPromedioPeriodo(est.id, selectedPeriodo)
                                        return prom >= 3.0 && prom < 3.5
                                    }).length}
                                </div>
                                <div className="text-yellow-600 text-sm">Suficientes</div>
                                <div className="text-yellow-500 text-xs">
                                    ({estudiantes.length > 0 ? Math.round((estudiantes.filter(est => {
                                        const prom = calcularPromedioPeriodo(est.id, selectedPeriodo)
                                        return prom >= 3.0 && prom < 3.5
                                    }).length / estudiantes.length) * 100) : 0}%)
                                </div>
                            </div>
                            <div className="bg-red-100 border border-red-200 rounded-lg p-4 text-center">
                                <div className="text-red-800 font-bold text-2xl">
                                    {estudiantes.filter(est => {
                                        const prom = calcularPromedioPeriodo(est.id, selectedPeriodo)
                                        return prom > 0 && prom < 3.0
                                    }).length}
                                </div>
                                <div className="text-red-600 text-sm">Reprobados</div>
                                <div className="text-red-500 text-xs">
                                    ({estudiantes.length > 0 ? Math.round((estudiantes.filter(est => {
                                        const prom = calcularPromedioPeriodo(est.id, selectedPeriodo)
                                        return prom > 0 && prom < 3.0
                                    }).length / estudiantes.length) * 100) : 0}%)
                                </div>
                            </div>
                            <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 text-center">
                                <div className="text-gray-800 font-bold text-2xl">
                                    {estudiantes.filter(est => calcularPromedioPeriodo(est.id, selectedPeriodo) === 0).length}
                                </div>
                                <div className="text-gray-600 text-sm">Sin notas</div>
                                <div className="text-gray-500 text-xs">
                                    ({estudiantes.length > 0 ? Math.round((estudiantes.filter(est => calcularPromedioPeriodo(est.id, selectedPeriodo) === 0).length / estudiantes.length) * 100) : 0}%)
                                </div>
                            </div>
                        </div>

                        {/* Lista detallada de estudiantes */}
                        <div className="bg-white rounded-lg border border-green-200 overflow-hidden">
                            <div className="p-4 border-b border-green-200 bg-green-50">
                                <h5 className="font-semibold text-green-800">Detalle por Estudiante</h5>
                            </div>
                            <div className="overflow-auto max-h-[400px]">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-green-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-green-600 uppercase tracking-wider">
                                                Estudiante
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-green-600 uppercase tracking-wider">
                                                Código
                                            </th>
                                            <th className="px-3 py-3 text-center text-xs font-medium text-green-600 uppercase tracking-wider">
                                                Promedio
                                            </th>
                                            <th className="px-3 py-3 text-center text-xs font-medium text-green-600 uppercase tracking-wider">
                                                Estado
                                            </th>
                                            <th className="px-3 py-3 text-center text-xs font-medium text-green-600 uppercase tracking-wider">
                                                Notas Registradas
                                            </th>
                                            <th className="px-3 py-3 text-center text-xs font-medium text-green-600 uppercase tracking-wider">
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {estudiantes.map((estudiante) => {
                                            const promedioPeriodo = calcularPromedioPeriodo(estudiante.id, selectedPeriodo)
                                            const estadoPeriodo = getEstadoNota(promedioPeriodo)
                                            const notasPeriodo = notas[selectedMateria.id]?.[estudiante.id]?.[`periodo${selectedPeriodo}`] || []

                                            return (
                                                <tr key={estudiante.id} className="hover:bg-green-50 transition-colors">
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                                                                <span className="text-sm font-medium text-green-600">
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
                                                        <span className={`text-lg font-bold ${estadoPeriodo}`}>
                                                            {promedioPeriodo > 0 ? promedioPeriodo.toFixed(1) : '--'}
                                                        </span>
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
                                                    <td className="px-3 py-4 whitespace-nowrap text-center">
                                                        <div className="flex flex-wrap gap-1 justify-center">
                                                            {notasPeriodo.length > 0 ? (
                                                                notasPeriodo.map((nota) => (
                                                                    <span
                                                                        key={nota.id}
                                                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
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
                                                        <button
                                                            onClick={() => handleDeleteStudent(estudiante.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Eliminar estudiante"
                                                        >
                                                            <TrashIcon className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
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

                                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                    <p className="text-sm text-blue-800">
                                        ℹ️ El código se generará automáticamente
                                    </p>
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
                                    disabled={!studentForm.nombre.trim()}
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
                            <div className={`px-3 py-2 rounded-lg text-sm font-medium border animate-pulse ${autoSaveStatus.includes('✅')
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : autoSaveStatus.includes('❌')
                                    ? 'bg-red-100 text-red-800 border-red-200'
                                    : 'bg-blue-100 text-blue-800 border-blue-200'
                                }`}>
                                <div className="flex items-center gap-2">
                                    {autoSaveStatus.includes('✅') && <span>✅</span>}
                                    {autoSaveStatus.includes('❌') && <span>❌</span>}
                                    <span>{autoSaveStatus}</span>
                                </div>
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
