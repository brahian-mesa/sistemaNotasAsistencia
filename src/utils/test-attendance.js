// Utilidad para probar el guardado de asistencias
import db from './database'

export const testAttendanceSave = async () => {
  console.log('🧪 INICIANDO PRUEBA DE GUARDADO DE ASISTENCIA...')
  
  try {
    // Datos de prueba
    const fechaPrueba = '2025-01-20'
    const estudianteId = 1
    const materiaId = 1
    const estado = 'presente'
    
    console.log('📋 Datos de prueba:', { fechaPrueba, estudianteId, materiaId, estado })
    
    // Guardar asistencia individual
    console.log('💾 Guardando asistencia individual...')
    const resultado = await db.guardarAsistenciaIndividual(estudianteId, materiaId, fechaPrueba, estado)
    console.log('✅ Resultado:', resultado)
    
    // Verificar que se guardó
    console.log('🔍 Verificando asistencia guardada...')
    const asistencias = await db.getAsistencia(fechaPrueba)
    console.log('📊 Asistencias encontradas:', asistencias.length)
    console.log('📋 Detalles:', asistencias.map(a => ({
      estudiante: a.estudiante_id,
      materia: a.materia_id,
      estado: a.estado,
      fecha: a.fecha
    })))
    
    return {
      success: true,
      message: 'Prueba completada exitosamente',
      asistencias: asistencias.length
    }
    
  } catch (error) {
    console.error('❌ Error en prueba:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export const testMultipleAttendance = async () => {
  console.log('🧪 INICIANDO PRUEBA DE MÚLTIPLES ASISTENCIAS...')
  
  try {
    const fechaPrueba = '2025-01-21'
    const asistenciasPrueba = [
      { estudianteId: 1, materiaId: 1, estado: 'presente' },
      { estudianteId: 2, materiaId: 1, estado: 'ausente' },
      { estudianteId: 3, materiaId: 1, estado: 'presente' }
    ]
    
    console.log('📋 Guardando múltiples asistencias...')
    
    // Guardar cada asistencia individualmente
    for (const asistencia of asistenciasPrueba) {
      console.log('💾 Guardando:', asistencia)
      await db.guardarAsistenciaIndividual(
        asistencia.estudianteId,
        asistencia.materiaId,
        fechaPrueba,
        asistencia.estado
      )
    }
    
    // Verificar resultados
    console.log('🔍 Verificando asistencias guardadas...')
    const asistencias = await db.getAsistencia(fechaPrueba)
    console.log('📊 Total asistencias encontradas:', asistencias.length)
    console.log('📋 Detalles:', asistencias.map(a => ({
      estudiante: a.estudiante_id,
      materia: a.materia_id,
      estado: a.estado,
      fecha: a.fecha
    })))
    
    return {
      success: true,
      message: 'Prueba de múltiples asistencias completada',
      esperadas: asistenciasPrueba.length,
      encontradas: asistencias.length
    }
    
  } catch (error) {
    console.error('❌ Error en prueba múltiple:', error)
    return {
      success: false,
      error: error.message
    }
  }
}