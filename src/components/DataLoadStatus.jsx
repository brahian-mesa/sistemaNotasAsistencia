import React, { useState, useEffect } from 'react';
import * as api from '../utils/api';

const DataLoadStatus = () => {
    const [loadStatus, setLoadStatus] = useState({
        estudiantes: false,
        materias: false,
        asistencia: false,
        notas: false,
        notasPersonales: false
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Verificar qué datos están cargados desde la API
        const checkLoadedData = async () => {
            setIsLoading(true);
            try {
                const [estudiantes, materias, asistencias, notas, notasPersonales] = await Promise.all([
                    api.getEstudiantes().catch(() => []),
                    api.getMaterias().catch(() => []),
                    api.getAsistencias().catch(() => []),
                    api.getNotas().catch(() => []),
                    api.getNotasPersonales().catch(() => [])
                ]);

                setLoadStatus({
                    estudiantes: estudiantes.length > 0,
                    materias: materias.length > 0,
                    asistencia: asistencias.length > 0,
                    notas: notas.length > 0,
                    notasPersonales: notasPersonales.length > 0
                });
            } catch (error) {
                console.error('Error verificando datos:', error);
                setLoadStatus({
                    estudiantes: false,
                    materias: false,
                    asistencia: false,
                    notas: false,
                    notasPersonales: false
                });
            } finally {
                setIsLoading(false);
            }
        };

        // Verificar al cargar
        checkLoadedData();

        // Verificar cada 30 segundos
        const interval = setInterval(checkLoadedData, 30000);

        return () => clearInterval(interval);
    }, []);

    const allLoaded = Object.values(loadStatus).every(status => status);
    const loadedCount = Object.values(loadStatus).filter(status => status).length;
    const totalCount = Object.keys(loadStatus).length;

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-600">Verificando conexión con la base de datos...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h4 className="text-md font-medium text-gray-700 mb-3">
                📊 Estado de Conexión con Base de Datos
            </h4>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Estudiantes</span>
                    <div className={`w-3 h-3 rounded-full ${loadStatus.estudiantes ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Materias</span>
                    <div className={`w-3 h-3 rounded-full ${loadStatus.materias ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Asistencia</span>
                    <div className={`w-3 h-3 rounded-full ${loadStatus.asistencia ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Notas</span>
                    <div className={`w-3 h-3 rounded-full ${loadStatus.notas ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Notas Personales</span>
                    <div className={`w-3 h-3 rounded-full ${loadStatus.notasPersonales ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                        Progreso: {loadedCount}/{totalCount}
                    </span>
                    <span className={`text-sm font-medium ${allLoaded ? 'text-green-600' : 'text-orange-600'}`}>
                        {allLoaded ? '✅ Base de datos conectada' : '⏳ Conectando...'}
                    </span>
                </div>

                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(loadedCount / totalCount) * 100}%` }}
                    ></div>
                </div>
            </div>

            {!allLoaded && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">
                        💡 <strong>Consejo:</strong> Asegúrate de que el backend esté ejecutándose en http://localhost:8080 para que la aplicación pueda conectarse a la base de datos.
                    </p>
                </div>
            )}
        </div>
    );
};

export default DataLoadStatus; 