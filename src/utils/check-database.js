// Verificar que las tablas de la base de datos existan
import supabase from './supabase'

export const checkDatabaseTables = async () => {
  console.log('🔍 Verificando estructura de la base de datos...')
  
  const tables = [
    'usuarios',
    'estudiantes', 
    'materias',
    'periodos_academicos',
    'asistencias',
    'tipos_nota_periodo',
    'notas_detalladas',
    'notas_individuales',
    'notas_personales'
  ]

  const results = {}
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1)
      
      if (error) {
        console.log(`❌ Tabla ${table}: ${error.message}`)
        results[table] = { exists: false, error: error.message }
      } else {
        console.log(`✅ Tabla ${table}: OK`)
        results[table] = { exists: true, count: data?.length || 0 }
      }
    } catch (error) {
      console.log(`❌ Error verificando tabla ${table}:`, error.message)
      results[table] = { exists: false, error: error.message }
    }
  }

  const missingTables = Object.entries(results)
    .filter(([table, result]) => !result.exists)
    .map(([table]) => table)

  if (missingTables.length > 0) {
    console.log('⚠️ Tablas faltantes:', missingTables)
    console.log('📋 Ejecuta el archivo supabase-schema.sql en Supabase SQL Editor')
  } else {
    console.log('✅ Todas las tablas existen correctamente')
  }

  return {
    allTablesExist: missingTables.length === 0,
    missingTables,
    results
  }
}

export const initializeDefaultData = async () => {
  console.log('🚀 Inicializando datos por defecto...')
  
  try {
    // Verificar si ya existen períodos académicos
    const { data: periodos, error } = await supabase
      .from('periodos_academicos')
      .select('numero')
    
    if (error) {
      console.log('❌ Error verificando períodos:', error.message)
      return false
    }

    if (periodos.length === 0) {
      console.log('📅 Insertando períodos académicos por defecto...')
      
      const periodosDefault = [
        { numero: 1, nombre: 'Período 1', fecha_inicio: '2025-01-27', fecha_fin: '2025-04-04', activo: true },
        { numero: 2, nombre: 'Período 2', fecha_inicio: '2025-04-07', fecha_fin: '2025-06-16', activo: true },
        { numero: 3, nombre: 'Período 3', fecha_inicio: '2025-07-07', fecha_fin: '2025-09-12', activo: true },
        { numero: 4, nombre: 'Período 4', fecha_inicio: '2025-09-15', fecha_fin: '2025-11-28', activo: true }
      ]

      const { error: insertError } = await supabase
        .from('periodos_academicos')
        .insert(periodosDefault)

      if (insertError) {
        console.log('❌ Error insertando períodos:', insertError.message)
        return false
      }

      console.log('✅ Períodos académicos inicializados')
    } else {
      console.log('✅ Períodos académicos ya existen')
    }

    return true
  } catch (error) {
    console.error('❌ Error inicializando datos:', error)
    return false
  }
}

export const testDatabaseConnection = async () => {
  console.log('🧪 Probando conexión con la base de datos...')
  
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('❌ Error de conexión:', error.message)
      return { success: false, error: error.message }
    }

    console.log('✅ Conexión exitosa')
    return { success: true }
  } catch (error) {
    console.error('❌ Error de conexión:', error)
    return { success: false, error: error.message }
  }
}