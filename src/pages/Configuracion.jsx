import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CalendarIcon,
    CheckCircleIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import PageContainer from '../components/PageContainer';
import auth from '../utils/auth';
import db from '../utils/database';

const Configuracion = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [saveMessage, setSaveMessage] = useState('');

    const [periodosAcademicos, setPeriodosAcademicos] = useState({
        1: { fechaInicio: '', fechaFin: '' },
        2: { fechaInicio: '', fechaFin: '' },
        3: { fechaInicio: '', fechaFin: '' },
        4: { fechaInicio: '', fechaFin: '' }
    });

    useEffect(() => {
        const user = auth.getCurrentUser();
        if (!user) {
            navigate('/login');
            return;
        }
        setCurrentUser(user);
        cargarPeriodos();
    }, [navigate]);

    const cargarPeriodos = async () => {
        setLoading(true);
        try {
            const periodosData = await db.getPeriodosAcademicos();
            console.log('📥 Períodos recibidos de BD:', periodosData);
            
            if (periodosData && Object.keys(periodosData).length > 0) {
                // Los períodos vienen como { 1: {fechaInicio, fechaFin}, 2: {...}, ... }
                setPeriodosAcademicos(periodosData);
                console.log('✅ Períodos cargados:', periodosData);
            } else {
                console.log('⚠️ No hay períodos guardados, usando valores por defecto');
                // Mantener el estado inicial si no hay períodos
            }
        } catch (error) {
            console.error('❌ Error cargando períodos:', error);
            setSaveMessage('❌ Error al cargar períodos: ' + error.message);
            setTimeout(() => setSaveMessage(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleGuardarPeriodos = async () => {
        setSaving(true);
        try {
            console.log('📅 Intentando guardar períodos:', periodosAcademicos);
            
            // Validar que al menos un periodo tenga fechas
            const algunPeriodoCompleto = Object.values(periodosAcademicos).some(
                periodo => periodo && periodo.fechaInicio && periodo.fechaFin
            );

            if (!algunPeriodoCompleto) {
                setSaveMessage('❌ Debes configurar al menos un período completo');
                setTimeout(() => setSaveMessage(''), 3000);
                setSaving(false);
                return;
            }

            console.log('📅 Guardando períodos académicos en la base de datos...');
            await db.guardarPeriodosAcademicos(periodosAcademicos);

            setSaveMessage('✅ Fechas de períodos actualizadas correctamente');
            console.log('✅ Períodos académicos guardados exitosamente');
            
            // Recargar los periodos para confirmar
            setTimeout(() => {
                cargarPeriodos();
            }, 500);
            
            setTimeout(() => setSaveMessage(''), 4000);
        } catch (error) {
            console.error('❌ Error guardando períodos:', error);
            setSaveMessage(`❌ Error: ${error.message || 'Error al guardar los períodos'}`);
            setTimeout(() => setSaveMessage(''), 5000);
        } finally {
            setSaving(false);
        }
    };

    const calcularDuracion = (fechaInicio, fechaFin) => {
        if (!fechaInicio || !fechaFin) return 0;
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
        return dias > 0 ? dias : 0;
    };

    if (loading) {
        return (
            <PageContainer>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <CalendarIcon className="w-8 h-8 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">
                                Configuración
                            </h1>
                            <p className="text-gray-600">
                                Actualiza las fechas de los períodos académicos
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mensaje de guardado */}
                {saveMessage && (
                    <div className={`mb-6 p-4 rounded-lg border ${
                        saveMessage.includes('✅')
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                        <p className="font-medium">{saveMessage}</p>
                    </div>
                )}

                {/* Card principal */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <CalendarIcon className="w-6 h-6 text-purple-600" />
                            Períodos Académicos
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Configura las fechas de inicio y fin de cada período
                        </p>
                    </div>

                    <div className="p-6">
                        {/* Grid de períodos */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {[1, 2, 3, 4].map(periodo => (
                                <div
                                    key={periodo}
                                    className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-5 border-2 border-gray-200 hover:border-purple-300 transition-all"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-lg font-bold">
                                            {periodo}
                                        </span>
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            Período {periodo}
                                        </h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                📅 Fecha de Inicio *
                                            </label>
                                            <input
                                                type="date"
                                                value={periodosAcademicos[periodo]?.fechaInicio || ''}
                                                onChange={(e) => setPeriodosAcademicos(prev => ({
                                                    ...prev,
                                                    [periodo]: { ...prev[periodo], fechaInicio: e.target.value }
                                                }))}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                📅 Fecha de Fin *
                                            </label>
                                            <input
                                                type="date"
                                                value={periodosAcademicos[periodo]?.fechaFin || ''}
                                                onChange={(e) => setPeriodosAcademicos(prev => ({
                                                    ...prev,
                                                    [periodo]: { ...prev[periodo], fechaFin: e.target.value }
                                                }))}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                            />
                                        </div>

                                        {periodosAcademicos[periodo]?.fechaInicio && periodosAcademicos[periodo]?.fechaFin && (
                                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                                <p className="text-sm text-purple-800 font-medium">
                                                    ⏱️ Duración: {calcularDuracion(
                                                        periodosAcademicos[periodo].fechaInicio,
                                                        periodosAcademicos[periodo].fechaFin
                                                    )} días
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Información */}
                        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                                💡 Información Importante
                            </h4>
                            <ul className="text-sm text-blue-700 space-y-1.5">
                                <li>• Las fechas se aplicarán automáticamente en Asistencia y Materias</li>
                                <li>• Los reportes y estadísticas usarán estos períodos</li>
                                <li>• Puedes actualizar las fechas cuando lo necesites</li>
                                <li>• Asegúrate de que las fechas no se sobrepongan entre períodos</li>
                            </ul>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex gap-4 mt-6">
                            <button
                                onClick={cargarPeriodos}
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-medium"
                            >
                                <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                                Recargar
                            </button>
                            <button
                                onClick={handleGuardarPeriodos}
                                disabled={saving}
                                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircleIcon className="w-5 h-5" />
                                        Guardar Cambios
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
};

export default Configuracion;
