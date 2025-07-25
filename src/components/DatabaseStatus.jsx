import React, { useState, useEffect } from 'react';
import * as api from '../utils/api';

const DatabaseStatus = () => {
    const [dbInfo, setDbInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDatabaseInfo = async () => {
            try {
                const [estudiantes, materias, asistencias, notas, notasPersonales] = await Promise.all([
                    api.getEstudiantes(),
                    api.getMaterias(),
                    api.getAsistencias(),
                    api.getNotas(),
                    api.getNotasPersonales()
                ]);

                const info = {
                    estudiantes: estudiantes.length,
                    materias: materias.length,
                    asistencias: asistencias.length,
                    notas: notas.length,
                    notas_personales: notasPersonales.length,
                    fecha_ultima_actualizacion: new Date().toISOString()
                };

                setDbInfo(info);
                setIsLoading(false);
            } catch (error) {
                console.error('Error cargando información de la BD:', error);
                setIsLoading(false);
            }
        };

        loadDatabaseInfo();

        // Actualizar cada 30 segundos
        const interval = setInterval(loadDatabaseInfo, 30000);

        return () => clearInterval(interval);
    }, []);

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-600">Cargando información de la base de datos...</span>
                </div>
            </div>
        );
    }

    if (!dbInfo) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-red-700 font-medium">Error conectando con la base de datos</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
                🗄️ Estado de la Base de Datos SQLite
            </h3>

            {/* Información general */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                        <span className="text-sm font-medium text-gray-700">Estudiantes</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{dbInfo.estudiantes}</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm font-medium text-gray-700">Materias</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600 mt-1">{dbInfo.materias}</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                        <span className="text-sm font-medium text-gray-700">Asistencias</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600 mt-1">{dbInfo.asistencias}</p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                        <span className="text-sm font-medium text-gray-700">Notas</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-600 mt-1">{dbInfo.notas}</p>
                </div>
            </div>

            {/* Estado de conexión */}
            <div className="mb-6">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        <span className="text-sm font-medium text-gray-700">Estado de conexión</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Conectado</span>
                </div>
            </div>

            {/* Información técnica */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-medium text-gray-700 mb-3">📊 Información Técnica</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-gray-600"><strong>Base de datos:</strong> SQLite</p>
                        <p className="text-gray-600"><strong>Archivo:</strong> sistema_escolar.db</p>
                        <p className="text-gray-600"><strong>Tablas:</strong> 5 tablas creadas</p>
                    </div>
                    <div>
                        <p className="text-gray-600"><strong>Última actualización:</strong></p>
                        <p className="text-gray-600">{new Date(dbInfo.fecha_ultima_actualizacion).toLocaleString('es-CO')}</p>
                        <p className="text-gray-600"><strong>Notas personales:</strong> {dbInfo.notas_personales} registro</p>
                    </div>
                </div>
            </div>

            {/* Acciones */}
            <div className="mt-6 flex flex-wrap gap-3">
                <button
                    onClick={async () => {
                        try {
                            const [estudiantes, materias, asistencias, notas, notasPersonales] = await Promise.all([
                                api.getEstudiantes(),
                                api.getMaterias(),
                                api.getAsistencias(),
                                api.getNotas(),
                                api.getNotasPersonales()
                            ]);
                            const datos = { estudiantes, materias, asistencias, notas, notasPersonales };
                            console.log('Datos exportados:', datos);
                        } catch (error) {
                            console.error('Error exportando datos:', error);
                        }
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                    📥 Exportar Datos
                </button>
                <button
                    onClick={async () => {
                        try {
                            const [estudiantes, materias, asistencias, notas, notasPersonales] = await Promise.all([
                                api.getEstudiantes(),
                                api.getMaterias(),
                                api.getAsistencias(),
                                api.getNotas(),
                                api.getNotasPersonales()
                            ]);
                            const info = {
                                estudiantes: estudiantes.length,
                                materias: materias.length,
                                asistencias: asistencias.length,
                                notas: notas.length,
                                notas_personales: notasPersonales.length,
                                fecha_ultima_actualizacion: new Date().toISOString()
                            };
                            setDbInfo(info);
                        } catch (error) {
                            console.error('Error actualizando estado:', error);
                        }
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                    🔄 Actualizar Estado
                </button>
            </div>

            {/* Información adicional */}
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h5 className="text-sm font-medium text-green-800 mb-2">✅ Ventajas de la Base de Datos</h5>
                <ul className="text-xs text-green-700 space-y-1">
                    <li>• Datos persistentes y seguros</li>
                    <li>• Consultas rápidas y eficientes</li>
                    <li>• Sin archivos temporales</li>
                    <li>• Backup automático de datos</li>
                    <li>• Historial completo de cambios</li>
                </ul>
            </div>
        </div>
    );
};

export default DatabaseStatus; 