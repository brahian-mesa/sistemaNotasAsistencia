import React, { useState, useEffect } from 'react';
import db from '../utils/database.js';

const FileStatus = () => {
    const [syncStatus, setSyncStatus] = useState({});
    const [lastUpdate, setLastUpdate] = useState('');
    const [files, setFiles] = useState([]);

    useEffect(() => {
        // Actualizar estado inicial
        updateStatus();

        // Escuchar cambios de datos
        const handleDataChange = (event) => {
            const { type, data, timestamp } = event.detail;
            updateStatus();

            // Mostrar notificación de actualización
            showNotification(`Archivo ${type} actualizado`, 'success');
        };

        window.addEventListener('dataChanged', handleDataChange);

        // Actualizar cada 30 segundos
        const interval = setInterval(updateStatus, 30000);

        return () => {
            window.removeEventListener('dataChanged', handleDataChange);
            clearInterval(interval);
        };
    }, []);

    const updateStatus = () => {
        const status = db.getSyncStatus();
        setSyncStatus(status);
        setLastUpdate(new Date(parseInt(status.lastUpdate)).toLocaleString());

        // Simular lista de archivos generados
        setFiles([
            { name: 'estudiantes.json', size: '2.1 KB', lastModified: new Date().toLocaleString() },
            { name: 'materias.json', size: '1.8 KB', lastModified: new Date().toLocaleString() },
            { name: 'asistencia.json', size: '0.5 KB', lastModified: new Date().toLocaleString() },
            { name: 'notas.json', size: '0.3 KB', lastModified: new Date().toLocaleString() }
        ]);
    };

    const showNotification = (message, type = 'info') => {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
            }`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    };

    const forceSave = () => {
        db.saveAllData();
        showNotification('Guardado manual ejecutado', 'success');
        updateStatus();
    };

    const downloadAllFiles = () => {
        db.exportarDatos();
        showNotification('Todos los archivos descargados', 'success');
    };

    const importFile = (event) => {
        const file = event.target.files[0];
        if (file) {
            db.importFile(file)
                .then(() => {
                    showNotification(`Archivo ${file.name} importado exitosamente`, 'success');
                    updateStatus();
                })
                .catch((error) => {
                    showNotification(`Error al importar ${file.name}: ${error.message}`, 'error');
                });
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
                📁 Estado de Archivos y Sincronización
            </h3>

            {/* Estado de sincronización */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${syncStatus.autoSaveEnabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-sm font-medium text-gray-700">Auto-guardado</span>
                        </div>
                        <button
                            onClick={() => {
                                const enabled = db.toggleAutoSave();
                                updateStatus();
                                showNotification(`Auto-guardado ${enabled ? 'activado' : 'desactivado'}`, 'info');
                            }}
                            className={`text-xs px-2 py-1 rounded ${syncStatus.autoSaveEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                        >
                            {syncStatus.autoSaveEnabled ? 'ON' : 'OFF'}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Manual por defecto</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${syncStatus.fileWatcherEnabled ? 'bg-blue-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-sm font-medium text-gray-700">Observador activo</span>
                        </div>
                        <button
                            onClick={() => {
                                const enabled = db.toggleFileWatcher();
                                updateStatus();
                                showNotification(`Observador ${enabled ? 'activado' : 'desactivado'}`, 'info');
                            }}
                            className={`text-xs px-2 py-1 rounded ${syncStatus.fileWatcherEnabled ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}
                        >
                            {syncStatus.fileWatcherEnabled ? 'ON' : 'OFF'}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Manual por defecto</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                        <span className="text-sm font-medium text-gray-700">Última actualización</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{lastUpdate}</p>
                </div>
            </div>

            {/* Lista de archivos */}
            <div className="mb-6">
                <h4 className="text-md font-medium text-gray-700 mb-3">📄 Archivos Generados</h4>
                <div className="space-y-2">
                    {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                                <span className="text-blue-600 mr-2">📄</span>
                                <span className="text-sm font-medium text-gray-700">{file.name}</span>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="text-xs text-gray-500">{file.size}</span>
                                <span className="text-xs text-gray-500">{file.lastModified}</span>
                                <button
                                    onClick={() => {
                                        // Simular descarga individual
                                        const data = file.name.includes('estudiantes') ? db.getEstudiantes() :
                                            file.name.includes('materias') ? db.getMaterias() :
                                                file.name.includes('asistencia') ? JSON.parse(localStorage.getItem("asistencia") || "{}") :
                                                    JSON.parse(localStorage.getItem("notas") || "{}");

                                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement("a");
                                        a.href = url;
                                        a.download = file.name;
                                        a.click();
                                        URL.revokeObjectURL(url);

                                        showNotification(`${file.name} descargado`, 'success');
                                    }}
                                    className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                                >
                                    Descargar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={forceSave}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                    💾 Guardar Ahora
                </button>
                <button
                    onClick={downloadAllFiles}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                    📥 Descargar Todos
                </button>
                <button
                    onClick={updateStatus}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                    🔄 Actualizar Estado
                </button>
                <button
                    onClick={() => {
                        const autoSaveEnabled = db.toggleAutoSave();
                        const fileWatcherEnabled = db.toggleFileWatcher();
                        updateStatus();
                        showNotification('Modo silencioso activado - Sin actualizaciones automáticas', 'info');
                    }}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                    🔇 Modo Silencioso
                </button>
                <label className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors cursor-pointer">
                    📁 Importar Archivo
                    <input
                        type="file"
                        accept=".json"
                        onChange={importFile}
                        className="hidden"
                    />
                </label>
            </div>

            {/* Información adicional */}
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                <h5 className="text-sm font-medium text-yellow-800 mb-2">ℹ️ Información</h5>
                <ul className="text-xs text-yellow-700 space-y-1">
                    <li>• Los archivos se guardan automáticamente en formato JSON</li>
                    <li>• Cada cambio se refleja inmediatamente en el frontend</li>
                    <li>• Los archivos se pueden descargar individualmente o todos juntos</li>
                    <li>• El sistema mantiene sincronización en tiempo real</li>
                </ul>
            </div>
        </div>
    );
};

export default FileStatus; 