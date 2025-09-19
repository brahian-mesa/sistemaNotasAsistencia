import React, { useState, useEffect } from 'react'
import supabase from '../utils/supabase'

const ConnectionStatus = () => {
  const [status, setStatus] = useState('checking') // checking, connected, error
  const [lastCheck, setLastCheck] = useState(null)

  const checkConnection = async () => {
    try {
      setStatus('checking')
      const { data, error } = await supabase
        .from('usuarios')
        .select('count')
        .limit(1)
      
      if (error) {
        setStatus('error')
        console.error('❌ Error de conexión:', error)
      } else {
        setStatus('connected')
        console.log('✅ Conexión exitosa')
      }
    } catch (error) {
      setStatus('error')
      console.error('❌ Error de conexión:', error)
    } finally {
      setLastCheck(new Date())
    }
  }

  useEffect(() => {
    checkConnection()
    
    // Verificar conexión cada 30 segundos
    const interval = setInterval(checkConnection, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      case 'checking':
      default:
        return 'bg-yellow-500'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Conectado'
      case 'error':
        return 'Sin conexión'
      case 'checking':
      default:
        return 'Verificando...'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return '✅'
      case 'error':
        return '❌'
      case 'checking':
      default:
        return '🔄'
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div 
        className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-white text-sm ${getStatusColor()}`}
        onClick={checkConnection}
        title="Hacer clic para verificar conexión"
      >
        <span>{getStatusIcon()}</span>
        <span className="font-medium">{getStatusText()}</span>
        {lastCheck && (
          <span className="text-xs opacity-75">
            {lastCheck.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  )
}

export default ConnectionStatus