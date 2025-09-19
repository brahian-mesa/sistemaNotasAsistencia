import React, { useState, useEffect } from 'react'
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { executeCompleteMigration } from '../utils/migrate-to-supabase-complete'

export default function MigrationStatus() {
  const [migrationStatus, setMigrationStatus] = useState('checking') // checking, needed, completed, error
  const [migrationResult, setMigrationResult] = useState(null)
  const [isMigrating, setIsMigrating] = useState(false)

  useEffect(() => {
    checkMigrationStatus()
  }, [])

  const checkMigrationStatus = () => {
    // Verificar si hay datos en localStorage
    const hasLocalData = [
      'sistema_escolar_estudiantes',
      'sistema_escolar_materias',
      'sistema_escolar_asistencias',
      'sistema_escolar_notas_personales',
      'calendar-events',
      'notassystem-theme'
    ].some(key => localStorage.getItem(key))

    if (hasLocalData) {
      setMigrationStatus('needed')
    } else {
      setMigrationStatus('completed')
    }
  }

  const handleMigration = async () => {
    setIsMigrating(true)
    try {
      const result = await executeCompleteMigration()
      setMigrationResult(result)
      
      if (result.success) {
        setMigrationStatus('completed')
      } else {
        setMigrationStatus('error')
      }
    } catch (error) {
      setMigrationResult({
        success: false,
        message: 'Error inesperado: ' + error.message
      })
      setMigrationStatus('error')
    } finally {
      setIsMigrating(false)
    }
  }

  const getStatusIcon = () => {
    switch (migrationStatus) {
      case 'needed':
        return <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
      case 'completed':
        return <CheckCircleIcon className="h-8 w-8 text-green-500" />
      case 'error':
        return <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
      default:
        return <InformationCircleIcon className="h-8 w-8 text-blue-500" />
    }
  }

  const getStatusMessage = () => {
    switch (migrationStatus) {
      case 'needed':
        return 'Se encontraron datos en localStorage que necesitan ser migrados a Supabase'
      case 'completed':
        return 'Todos los datos están migrados a Supabase correctamente'
      case 'error':
        return 'Hubo un error durante la migración'
      default:
        return 'Verificando estado de migración...'
    }
  }

  const getStatusColor = () => {
    switch (migrationStatus) {
      case 'needed':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  if (migrationStatus === 'completed' && !migrationResult) {
    return null // No mostrar nada si ya está migrado y no hay resultado
  }

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg border shadow-lg ${getStatusColor()}`}>
      <div className="flex items-start space-x-3">
        {getStatusIcon()}
        <div className="flex-1">
          <h3 className="font-semibold text-sm">
            {migrationStatus === 'needed' ? 'Migración Requerida' :
             migrationStatus === 'completed' ? 'Migración Completada' :
             migrationStatus === 'error' ? 'Error en Migración' :
             'Estado de Migración'}
          </h3>
          <p className="text-sm mt-1">
            {getStatusMessage()}
          </p>
          
          {migrationResult && (
            <div className="mt-2 text-xs">
              <p className="font-medium">{migrationResult.message}</p>
              {migrationResult.details && (
                <div className="mt-1 space-y-1">
                  {Object.entries(migrationResult.details).map(([key, result]) => (
                    <div key={key} className="flex justify-between">
                      <span className="capitalize">{key.replace('_', ' ')}:</span>
                      <span className="font-medium">
                        {result.migrated} migrados, {result.errors} errores
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {migrationStatus === 'needed' && (
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleMigration}
                disabled={isMigrating}
                className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMigrating ? 'Migrando...' : 'Migrar Ahora'}
              </button>
              <button
                onClick={() => setMigrationStatus('completed')}
                className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
              >
                Más Tarde
              </button>
            </div>
          )}

          {migrationStatus === 'error' && (
            <div className="mt-3">
              <button
                onClick={handleMigration}
                disabled={isMigrating}
                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMigrating ? 'Reintentando...' : 'Reintentar'}
              </button>
            </div>
          )}

          {(migrationStatus === 'completed' || migrationStatus === 'error') && (
            <div className="mt-3">
              <button
                onClick={() => {
                  setMigrationStatus('checking')
                  setMigrationResult(null)
                  checkMigrationStatus()
                }}
                className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}