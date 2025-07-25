import React, { useState, useEffect } from 'react';
import * as api from '../utils/api';

const DatabaseViewer = () => {
    const [activeTab, setActiveTab] = useState('estudiantes');
    const [data, setData] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const tabs = [
        { id: 'estudiantes', name: '👥 Estudiantes', icon: '👥' },
        { id: 'materias', name: '📚 Materias', icon: '📚' },
        { id: 'asistencias', name: '📅 Asistencias', icon: '📅' },
        { id: 'notas', name: '📝 Notas', icon: '📝' },
        { id: 'notas_personales', name: '📋 Notas Personales', icon: '📋' }
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [estudiantes, materias, asistencias, notas, notasPersonales] = await Promise.all([
                api.getEstudiantes(),
                api.getMaterias(),
                api.getAsistencias(),
                api.getNotas(),
                api.getNotasPersonales()
            ]);

            const allData = {
                estudiantes,
                materias,
                asistencias,
                notas,
                notas_personales: notasPersonales
            };
            setData(allData);
            setIsLoading(false);
        } catch (error) {
            console.error('Error cargando datos:', error);
            setIsLoading(false);
        }
    };

    const renderTable = (tableData, columns) => {
        if (!tableData || tableData.length === 0) {
            return (
                <div className="text-center py-8 text-gray-500">
                    <p>No hay datos en esta tabla</p>
                </div>
            );
        }

        return (
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((column, index) => (
                                <th key={index} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {tableData.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-gray-50">
                                {columns.map((column, colIndex) => (
                                    <td key={colIndex} className="px-4 py-3 text-sm text-gray-900 border-b">
                                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const getTableConfig = (tableName) => {
        const configs = {
            estudiantes: [
                { key: 'id', label: 'ID' },
                { key: 'nombre', label: 'Nombre' },
                { key: 'codigo', label: 'Código' },
                {
                    key: 'created_at',
                    label: 'Fecha Creación',
                    render: (value) => new Date(value).toLocaleDateString('es-CO')
                }
            ],
            materias: [
                { key: 'id', label: 'ID' },
                { key: 'nombre', label: 'Nombre' },
                { key: 'codigo', label: 'Código' },
                { key: 'grado', label: 'Grado' },
                { key: 'horario', label: 'Horario' },
                {
                    key: 'color',
                    label: 'Color',
                    render: (value) => (
                        <span className={`px-2 py-1 rounded text-xs ${value}`}>
                            Color
                        </span>
                    )
                }
            ],
            asistencias: [
                { key: 'id', label: 'ID' },
                { key: 'estudiante_id', label: 'Estudiante ID' },
                { key: 'materia_id', label: 'Materia ID' },
                { key: 'fecha', label: 'Fecha' },
                {
                    key: 'estado',
                    label: 'Estado',
                    render: (value) => (
                        <span className={`px-2 py-1 rounded text-xs ${value === 'presente' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {value}
                        </span>
                    )
                }
            ],
            notas: [
                { key: 'id', label: 'ID' },
                { key: 'estudiante_id', label: 'Estudiante ID' },
                { key: 'materia_id', label: 'Materia ID' },
                { key: 'periodo', label: 'Período' },
                { key: 'tipo_nota', label: 'Tipo' },
                { key: 'valor', label: 'Valor' },
                { key: 'observaciones', label: 'Observaciones' }
            ],
            notas_personales: [
                { key: 'id', label: 'ID' },
                {
                    key: 'contenido',
                    label: 'Contenido',
                    render: (value) => (
                        <div className="max-w-xs truncate" title={value}>
                            {value}
                        </div>
                    )
                },
                {
                    key: 'fecha_actualizacion',
                    label: 'Última Actualización',
                    render: (value) => new Date(value).toLocaleString('es-CO')
                }
            ]
        };

        return configs[tableName] || [];
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-600">Cargando datos de la base de datos...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">
                    🗄️ Visor de Base de Datos
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    Visualiza todos los datos almacenados en el sistema
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.name}
                            <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                                {data[tab.id]?.length || 0}
                            </span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            <div className="p-6">
                {/* Actions */}
                <div className="mb-4 flex justify-between items-center">
                    <div>
                        <h4 className="text-md font-medium text-gray-800">
                            {tabs.find(t => t.id === activeTab)?.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                            {data[activeTab]?.length || 0} registros encontrados
                        </p>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={loadData}
                            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                        >
                            🔄 Actualizar
                        </button>
                        <button
                            onClick={() => {
                                const datos = db.exportarDatos();
                                console.log('Datos exportados:', datos);
                            }}
                            className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                        >
                            📥 Exportar
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-gray-50 rounded-lg p-4">
                    {renderTable(data[activeTab], getTableConfig(activeTab))}
                </div>

                {/* Statistics */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {tabs.map((tab) => (
                        <div key={tab.id} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center">
                                <span className="text-2xl mr-2">{tab.icon}</span>
                                <div>
                                    <p className="text-sm font-medium text-gray-700">{tab.name}</p>
                                    <p className="text-lg font-bold text-gray-900">{data[tab.id]?.length || 0}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Database Info */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h5 className="text-sm font-medium text-blue-800 mb-2">📊 Información de la Base de Datos</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-blue-600"><strong>Total Estudiantes:</strong></p>
                            <p className="text-blue-800">{data.estudiantes?.length || 0}</p>
                        </div>
                        <div>
                            <p className="text-blue-600"><strong>Total Materias:</strong></p>
                            <p className="text-blue-800">{data.materias?.length || 0}</p>
                        </div>
                        <div>
                            <p className="text-blue-600"><strong>Total Asistencias:</strong></p>
                            <p className="text-blue-800">{data.asistencias?.length || 0}</p>
                        </div>
                        <div>
                            <p className="text-blue-600"><strong>Total Notas:</strong></p>
                            <p className="text-blue-800">{data.notas?.length || 0}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatabaseViewer; 