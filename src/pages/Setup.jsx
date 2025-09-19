import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    AcademicCapIcon, 
    BookOpenIcon, 
    UserGroupIcon, 
    ClockIcon,
    CheckCircleIcon,
    PlusIcon,
    TrashIcon,
    PencilIcon
} from '@heroicons/react/24/outline';
import auth from '../utils/auth';
import db from '../utils/database';

const Setup = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // Estados para cada paso
    const [academicInfo, setAcademicInfo] = useState({
        grado: '',
        horarios: '',
        jornada: 'mañana'
    });

    const [periodosAcademicos, setPeriodosAcademicos] = useState({
        1: { fechaInicio: '', fechaFin: '' },
        2: { fechaInicio: '', fechaFin: '' },
        3: { fechaInicio: '', fechaFin: '' },
        4: { fechaInicio: '', fechaFin: '' }
    });

    const [materias, setMaterias] = useState([]);
    const [estudiantes, setEstudiantes] = useState([]);
    const [nuevaMateria, setNuevaMateria] = useState({ nombre: '', codigo: '', horario: [] });
    const [nuevoEstudiante, setNuevoEstudiante] = useState({ nombre: '', codigo: '' });

    // Estados para modales
    const [showMateriaModal, setShowMateriaModal] = useState(false);
    const [showEstudianteModal, setShowEstudianteModal] = useState(false);
    const [editingMateria, setEditingMateria] = useState(null);
    const [editingEstudiante, setEditingEstudiante] = useState(null);

    const totalSteps = 4;

    useEffect(() => {
        const user = auth.getCurrentUser();
        if (!user) {
            navigate('/login');
            return;
        }
        setCurrentUser(user);
    }, [navigate]);

    const handleNext = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            console.log('🚀 Iniciando configuración...');
            
            // Verificar conexión a Supabase primero
            console.log('🔍 Verificando conexión a Supabase...');
            const connectionTest = await db.testConnection();
            if (!connectionTest) {
                throw new Error('No se puede conectar a Supabase. Verifica tu conexión a internet.');
            }
            
            // 1. Actualizar información académica del usuario
            console.log('📝 Actualizando perfil de usuario...');
            const updateResult = await auth.updateProfile({
                grado: academicInfo.grado
            });

            if (!updateResult.success) {
                throw new Error(updateResult.error || 'Error actualizando perfil');
            }

            // 2. Guardar materias una por una para mejor manejo de errores
            if (materias.length > 0) {
                console.log(`📚 Guardando ${materias.length} materias...`);
                for (let i = 0; i < materias.length; i++) {
                    try {
                        await db.guardarMateria({
                            ...materias[i],
                            grado: academicInfo.grado,
                            color: getRandomColor()
                        });
                        console.log(`✅ Materia ${i + 1}/${materias.length} guardada`);
                    } catch (error) {
                        console.error(`❌ Error guardando materia ${i + 1}:`, error);
                        throw new Error(`Error guardando materia "${materias[i].nombre}": ${error.message}`);
                    }
                }
            }

            // 3. Guardar estudiantes uno por uno para mejor manejo de errores
            if (estudiantes.length > 0) {
                console.log(`👥 Guardando ${estudiantes.length} estudiantes...`);
                for (let i = 0; i < estudiantes.length; i++) {
                    try {
                        await db.guardarEstudiante({
                            ...estudiantes[i],
                            grado: academicInfo.grado
                        });
                        console.log(`✅ Estudiante ${i + 1}/${estudiantes.length} guardado`);
                    } catch (error) {
                        console.error(`❌ Error guardando estudiante ${i + 1}:`, error);
                        throw new Error(`Error guardando estudiante "${estudiantes[i].nombre}": ${error.message}`);
                    }
                }
            }

            // 4. Guardar períodos académicos
            console.log('📅 Guardando períodos académicos...');
            try {
                await db.guardarPeriodosAcademicos(periodosAcademicos);
                console.log('✅ Períodos académicos guardados');
            } catch (error) {
                console.error('❌ Error guardando períodos académicos:', error);
                throw new Error(`Error guardando períodos académicos: ${error.message}`);
            }

            console.log('✅ Configuración completada exitosamente');
            
            // Refrescar el usuario desde la base de datos para asegurar datos actualizados
            try {
                await auth.refreshUser();
                const updatedUser = auth.getCurrentUser();
                console.log('👤 Usuario actualizado:', updatedUser);
            } catch (error) {
                console.warn('⚠️ Error refrescando usuario, pero la configuración se completó:', error);
            }
            
            alert('¡Configuración completada! Redirigiendo al panel principal...');
            
            // Pequeño delay para asegurar que la actualización se procese
            setTimeout(() => {
                navigate('/home');
            }, 500);
        } catch (error) {
            console.error('❌ Error completando configuración:', error);
            
            // Mensaje de error más específico
            let errorMessage = 'Error desconocido';
            if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Error de conexión. Verifica tu internet y que Supabase esté funcionando.';
            } else if (error.message.includes('NetworkError')) {
                errorMessage = 'Error de red. Verifica tu conexión a internet.';
            } else if (error.message.includes('Unauthorized')) {
                errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
            } else {
                errorMessage = error.message;
            }
            
            alert(`Error al completar la configuración: ${errorMessage}. Intenta de nuevo.`);
        } finally {
            setLoading(false);
        }
    };

    const getRandomColor = () => {
        const colors = [
            'bg-blue-100 text-blue-800 border-blue-200',
            'bg-green-100 text-green-800 border-green-200',
            'bg-purple-100 text-purple-800 border-purple-200',
            'bg-red-100 text-red-800 border-red-200',
            'bg-orange-100 text-orange-800 border-orange-200',
            'bg-indigo-100 text-indigo-800 border-indigo-200'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    const handleAddMateria = () => {
        if (!nuevaMateria.nombre.trim()) return;

        const materia = {
            id: Date.now(),
            nombre: nuevaMateria.nombre.trim(),
            codigo: nuevaMateria.codigo.trim() || nuevaMateria.nombre.substring(0, 3).toUpperCase(),
            horario: nuevaMateria.horario.length > 0 ? nuevaMateria.horario.join(', ') : 'Por definir'
        };

        setMaterias([...materias, materia]);
        setNuevaMateria({ nombre: '', codigo: '', horario: [] });
        setShowMateriaModal(false);
    };

    const handleEditMateria = (materia) => {
        setEditingMateria(materia);
        setNuevaMateria({
            nombre: materia.nombre,
            codigo: materia.codigo,
            horario: materia.horario === 'Por definir' ? [] : materia.horario.split(', ').filter(d => d.trim())
        });
        setShowMateriaModal(true);
    };

    const handleUpdateMateria = () => {
        if (!nuevaMateria.nombre.trim()) return;

        const materiaActualizada = {
            ...editingMateria,
            nombre: nuevaMateria.nombre.trim(),
            codigo: nuevaMateria.codigo.trim(),
            horario: nuevaMateria.horario.length > 0 ? nuevaMateria.horario.join(', ') : 'Por definir'
        };

        setMaterias(materias.map(m => m.id === editingMateria.id ? materiaActualizada : m));
        setNuevaMateria({ nombre: '', codigo: '', horario: [] });
        setEditingMateria(null);
        setShowMateriaModal(false);
    };

    const handleDeleteMateria = (id) => {
        setMaterias(materias.filter(m => m.id !== id));
    };

    const handleAddEstudiante = () => {
        if (!nuevoEstudiante.nombre.trim() || !nuevoEstudiante.codigo.trim()) return;

        const estudiante = {
            id: Date.now(),
            nombre: nuevoEstudiante.nombre.trim(),
            codigo: nuevoEstudiante.codigo.trim()
        };

        setEstudiantes([...estudiantes, estudiante]);
        setNuevoEstudiante({ nombre: '', codigo: '' });
        setShowEstudianteModal(false);
    };

    const handleEditEstudiante = (estudiante) => {
        setEditingEstudiante(estudiante);
        setNuevoEstudiante({
            nombre: estudiante.nombre,
            codigo: estudiante.codigo
        });
        setShowEstudianteModal(true);
    };

    const handleUpdateEstudiante = () => {
        if (!nuevoEstudiante.nombre.trim() || !nuevoEstudiante.codigo.trim()) return;

        const estudianteActualizado = {
            ...editingEstudiante,
            nombre: nuevoEstudiante.nombre.trim(),
            codigo: nuevoEstudiante.codigo.trim()
        };

        setEstudiantes(estudiantes.map(e => e.id === editingEstudiante.id ? estudianteActualizado : e));
        setNuevoEstudiante({ nombre: '', codigo: '' });
        setEditingEstudiante(null);
        setShowEstudianteModal(false);
    };

    const handleDeleteEstudiante = (id) => {
        setEstudiantes(estudiantes.filter(e => e.id !== id));
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return academicInfo.grado && academicInfo.horarios;
            case 2:
                return materias.length > 0;
            case 3:
                return estudiantes.length > 0;
            case 4:
                return Object.values(periodosAcademicos).every(periodo => 
                    periodo.fechaInicio && periodo.fechaFin
                );
            default:
                return false;
        }
    };

    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <AcademicCapIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Información Académica</h2>
                <p className="text-gray-600">Configura tu información básica como docente</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grado que enseñas *
                    </label>
                    <select
                        value={academicInfo.grado}
                        onChange={(e) => setAcademicInfo({...academicInfo, grado: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Seleccionar grado</option>
                        <option value="1°">1°</option>
                        <option value="2°">2°</option>
                        <option value="3°">3°</option>
                        <option value="4°">4°</option>
                        <option value="5a">5°</option>
                        <option value="5b">5°</option>
                        <option value="6°">6°</option>
                        <option value="7°">7°</option>
                        <option value="8°">8°</option>
                        <option value="9°">9°</option>
                        <option value="10°">10°</option>
                        <option value="11°">11°</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Horarios de clase *
                    </label>
                    <select
                        value={academicInfo.horarios}
                        onChange={(e) => setAcademicInfo({...academicInfo, horarios: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Seleccionar horario</option>
                        
                        {/* Jornada Mañana */}
                        <optgroup label="Jornada Mañana">
                            <option value="Lunes a Viernes - 7:00 AM a 12:30 PM">Lunes a Viernes - 7:00 AM a 11:00 AM</option>  
                        </optgroup>
                        {/* Opción Personalizada */}
                        <optgroup label="⚙️ Otros">
                            <option value="Personalizado">Personalizado (especificar en notas)</option>
                        </optgroup>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jornada
                    </label>
                    <select
                        value={academicInfo.jornada}
                        onChange={(e) => setAcademicInfo({...academicInfo, jornada: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="mañana">Mañana</option>
                    </select>
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <BookOpenIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Materias que Enseñas</h2>
                <p className="text-gray-600">Agrega las materias que impartes en este grado</p>
            </div>

            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                    Materias ({materias.length})
                </h3>
                <button
                    onClick={() => setShowMateriaModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                    <PlusIcon className="w-4 h-4" />
                    Agregar Materia
                </button>
            </div>

            {materias.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <BookOpenIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay materias agregadas</h3>
                    <p className="text-gray-500 mb-4">Comienza agregando las materias que enseñas</p>
                    <button
                        onClick={() => setShowMateriaModal(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Agregar Primera Materia
                    </button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {materias.map((materia) => (
                        <div key={materia.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800">{materia.nombre}</h4>
                                    <p className="text-sm text-gray-600">Código: {materia.codigo}</p>
                                    <p className="text-sm text-gray-600">Horario: {materia.horario}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleEditMateria(materia)}
                                        className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                    >
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteMateria(materia.id)}
                                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <UserGroupIcon className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Estudiantes de tu Clase</h2>
                <p className="text-gray-600">Agrega los estudiantes que tienes en este grado</p>
            </div>

            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                    Estudiantes ({estudiantes.length})
                </h3>
                <button
                    onClick={() => setShowEstudianteModal(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                    <PlusIcon className="w-4 h-4" />
                    Agregar Estudiante
                </button>
            </div>

            {estudiantes.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay estudiantes agregados</h3>
                    <p className="text-gray-500 mb-4">Comienza agregando los estudiantes de tu clase</p>
                    <button
                        onClick={() => setShowEstudianteModal(true)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Agregar Primer Estudiante
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-auto max-h-[400px]">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nombre
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Código
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {estudiantes.map((estudiante) => (
                                    <tr key={estudiante.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{estudiante.nombre}</div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{estudiante.codigo}</div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-center">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleEditEstudiante(estudiante)}
                                                    className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEstudiante(estudiante.id)}
                                                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <ClockIcon className="w-16 h-16 text-orange-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Períodos Académicos</h2>
                <p className="text-gray-600">Configura las fechas de los 4 períodos del año escolar</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {[1, 2, 3, 4].map(periodo => (
                    <div key={periodo} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                                {periodo}
                            </span>
                            Período {periodo}
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fecha de Inicio *
                                </label>
                                <input
                                    type="date"
                                    value={periodosAcademicos[periodo]?.fechaInicio || ''}
                                    onChange={(e) => setPeriodosAcademicos(prev => ({
                                        ...prev,
                                        [periodo]: { ...prev[periodo], fechaInicio: e.target.value }
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fecha de Fin *
                                </label>
                                <input
                                    type="date"
                                    value={periodosAcademicos[periodo]?.fechaFin || ''}
                                    onChange={(e) => setPeriodosAcademicos(prev => ({
                                        ...prev,
                                        [periodo]: { ...prev[periodo], fechaFin: e.target.value }
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                            
                            {periodosAcademicos[periodo]?.fechaInicio && periodosAcademicos[periodo]?.fechaFin && (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                    <p className="text-sm text-orange-700">
                                        <strong>Duración:</strong> {
                                            Math.ceil(
                                                (new Date(periodosAcademicos[periodo]?.fechaFin) - 
                                                 new Date(periodosAcademicos[periodo]?.fechaInicio)) /
                                                 (1000 * 60 * 60 * 24)
                                            )
                                        } días
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">💡 Información Importante</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Las fechas de los períodos se usarán en todas las páginas del sistema</li>
                    <li>• Se calcularán automáticamente las estadísticas por período</li>
                    <li>• Los reportes y exportaciones usarán estas fechas</li>
                    <li>• Puedes modificar estas fechas después desde la configuración</li>
                </ul>
            </div>
        </div>
    );

    if (!currentUser) {
        return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        ¡Bienvenido, {currentUser.nombre}!
                    </h1>
                    <p className="text-gray-600">
                        Configura tu información académica para comenzar a usar el sistema
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                            Paso {currentStep} de {totalSteps}
                        </span>
                        <span className="text-sm text-gray-500">
                            {Math.round((currentStep / totalSteps) * 100)}% completado
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Step Content */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-8 mb-8">
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                    {currentStep === 4 && renderStep4()}
                </div>

                {/* Navigation */}
                <div className="flex justify-between">
                    <button
                        onClick={handlePrevious}
                        disabled={currentStep === 1}
                        className="px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Anterior
                    </button>

                    {currentStep < totalSteps ? (
                        <button
                            onClick={handleNext}
                            disabled={!canProceed()}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Siguiente
                        </button>
                    ) : (
                        <button
                            onClick={handleFinish}
                            disabled={!canProceed() || loading}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Completando...
                                </>
                            ) : (
                                <>
                                    <CheckCircleIcon className="w-5 h-5" />
                                    Completar Configuración
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Modal para agregar/editar materia */}
            {showMateriaModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 w-full max-w-md mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingMateria ? 'Editar Materia' : 'Agregar Nueva Materia'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowMateriaModal(false);
                                    setEditingMateria(null);
                                    setNuevaMateria({ nombre: '', codigo: '', horario: [] });
                                }}
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
                                    value={nuevaMateria.nombre}
                                    onChange={(e) => setNuevaMateria({...nuevaMateria, nombre: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="Ej: Matemáticas"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Código
                                </label>
                                <input
                                    type="text"
                                    value={nuevaMateria.codigo}
                                    onChange={(e) => setNuevaMateria({...nuevaMateria, codigo: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="Ej: MAT"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Días de Clase
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((dia) => (
                                        <label key={dia} className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={nuevaMateria.horario.includes(dia)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setNuevaMateria({
                                                            ...nuevaMateria,
                                                            horario: [...nuevaMateria.horario, dia]
                                                        });
                                                    } else {
                                                        setNuevaMateria({
                                                            ...nuevaMateria,
                                                            horario: nuevaMateria.horario.filter(d => d !== dia)
                                                        });
                                                    }
                                                }}
                                                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                                            />
                                            <span className="text-sm text-gray-700">{dia}</span>
                                        </label>
                                    ))}
                                </div>
                                {nuevaMateria.horario.length > 0 && (
                                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                        <p className="text-sm text-green-700">
                                            <strong>Días seleccionados:</strong> {nuevaMateria.horario.join(', ')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowMateriaModal(false);
                                    setEditingMateria(null);
                                    setNuevaMateria({ nombre: '', codigo: '', horario: [] });
                                }}
                                className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={editingMateria ? handleUpdateMateria : handleAddMateria}
                                disabled={!nuevaMateria.nombre.trim()}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                {editingMateria ? 'Actualizar' : 'Agregar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para agregar/editar estudiante */}
            {showEstudianteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 w-full max-w-md mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingEstudiante ? 'Editar Estudiante' : 'Agregar Nuevo Estudiante'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowEstudianteModal(false);
                                    setEditingEstudiante(null);
                                    setNuevoEstudiante({ nombre: '', codigo: '' });
                                }}
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
                                    value={nuevoEstudiante.nombre}
                                    onChange={(e) => setNuevoEstudiante({...nuevoEstudiante, nombre: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Ej: Juan Pérez García"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Código Estudiantil *
                                </label>
                                <input
                                    type="text"
                                    value={nuevoEstudiante.codigo}
                                    onChange={(e) => setNuevoEstudiante({...nuevoEstudiante, codigo: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Ej: 5B001"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowEstudianteModal(false);
                                    setEditingEstudiante(null);
                                    setNuevoEstudiante({ nombre: '', codigo: '' });
                                }}
                                className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={editingEstudiante ? handleUpdateEstudiante : handleAddEstudiante}
                                disabled={!nuevoEstudiante.nombre.trim() || !nuevoEstudiante.codigo.trim()}
                                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                {editingEstudiante ? 'Actualizar' : 'Agregar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Setup;