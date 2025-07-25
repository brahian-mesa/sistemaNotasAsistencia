import { useState } from 'react'
import { ArrowDownTrayIcon, ArrowUpTrayIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import * as api from '../utils/api'

export default function DataManager() {
    const [isExporting, setIsExporting] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [message, setMessage] = useState('')
    const [messageType, setMessageType] = useState('')

    const exportarDatos = async () => {
        setIsExporting(true)
        setMessage('')

        try {
            const [estudiantes, materias, asistencias, notas, notasPersonales] = await Promise.all([
                api.getEstudiantes(),
                api.getMaterias(),
                api.getAsistencias(),
                api.getNotas(),
                api.getNotasPersonales()
            ]);

            const datos = {
                estudiantes,
                materias,
                asistencias,
                notas,
                notasPersonales,
                fechaExportacion: new Date().toISOString()
            };

            // Crear y descargar archivo
            const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sistema_escolar_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setMessage('✅ Datos exportados exitosamente')
            setMessageType('success')
        } catch (error) {
            setMessage('❌ Error al exportar datos: ' + error.message)
            setMessageType('error')
        } finally {
            setIsExporting(false)
        }
    }

    const importarDatos = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = async (e) => {
            const file = e.target.files[0]
            if (!file) return

            setIsImporting(true)
            setMessage('')

            try {
                const text = await file.text()
                const datos = JSON.parse(text)

                // Importar datos a la base de datos
                let importados = 0;
                let errores = 0;

                // Importar estudiantes
                if (datos.estudiantes) {
                    for (const estudiante of datos.estudiantes) {
                        try {
                            await api.addEstudiante(estudiante);
                            importados++;
                        } catch (error) {
                            errores++;
                        }
                    }
                }

                // Importar materias
                if (datos.materias) {
                    for (const materia of datos.materias) {
                        try {
                            await api.addMateria(materia);
                            importados++;
                        } catch (error) {
                            errores++;
                        }
                    }
                }

                // Importar asistencias
                if (datos.asistencias) {
                    for (const asistencia of datos.asistencias) {
                        try {
                            await api.addAsistencia(asistencia);
                            importados++;
                        } catch (error) {
                            errores++;
                        }
                    }
                }

                // Importar notas
                if (datos.notas) {
                    for (const nota of datos.notas) {
                        try {
                            await api.addNota(nota);
                            importados++;
                        } catch (error) {
                            errores++;
                        }
                    }
                }

                // Importar notas personales
                if (datos.notasPersonales) {
                    for (const notaPersonal of datos.notasPersonales) {
                        try {
                            await api.addNotaPersonal(notaPersonal);
                            importados++;
                        } catch (error) {
                            errores++;
                        }
                    }
                }

                if (errores === 0) {
                    setMessage(`✅ Datos importados exitosamente. ${importados} registros importados.`)
                    setMessageType('success')
                } else {
                    setMessage(`⚠️ Importación parcial: ${importados} importados, ${errores} errores.`)
                    setMessageType('error')
                }
            } catch (error) {
                setMessage('❌ Error al leer el archivo: ' + error.message)
                setMessageType('error')
            } finally {
                setIsImporting(false)
            }
        }
        input.click()
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Gestión de Datos</h3>

            <div className="space-y-4">
                {/* Información */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-blue-800 mb-1">Respaldo de Datos</h4>
                            <p className="text-sm text-blue-700">
                                Te recomendamos exportar tus datos semanalmente para mantener un respaldo seguro.
                                Los datos se guardan en la base de datos SQLite del backend.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Botones */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={exportarDatos}
                        disabled={isExporting}
                        className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        {isExporting ? 'Exportando...' : '📥 Exportar Datos'}
                    </button>

                    <button
                        onClick={importarDatos}
                        disabled={isImporting}
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowUpTrayIcon className="w-4 h-4" />
                        {isImporting ? 'Importando...' : '📤 Importar Datos'}
                    </button>
                </div>

                {/* Mensaje de estado */}
                {message && (
                    <div className={`p-3 rounded-lg border ${messageType === 'success'
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
                        <div className="flex items-center gap-2">
                            {messageType === 'success' ? (
                                <CheckCircleIcon className="w-4 h-4" />
                            ) : (
                                <ExclamationTriangleIcon className="w-4 h-4" />
                            )}
                            <span className="text-sm">{message}</span>
                        </div>
                    </div>
                )}

                {/* Información técnica */}
                <div className="text-xs text-gray-500 space-y-1">
                    <p>💾 <strong>Ubicación de datos:</strong> Base de datos SQLite (Backend)</p>
                    <p>📁 <strong>Archivo de respaldo:</strong> sistema_escolar_[fecha].json</p>
                    <p>🔄 <strong>Frecuencia recomendada:</strong> Exportar semanalmente</p>
                </div>
            </div>
        </div>
    )
} 