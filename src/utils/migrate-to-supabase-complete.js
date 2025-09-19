// Script de migración completa de localStorage a Supabase
// Este script migra todos los datos existentes de localStorage a Supabase

import supabase from './supabase'
import auth from './auth'

class CompleteMigration {
  constructor() {
    this.migrationResults = {
      estudiantes: { migrated: 0, errors: 0 },
      materias: { migrated: 0, errors: 0 },
      asistencias: { migrated: 0, errors: 0 },
      notas_personales: { migrated: 0, errors: 0 },
      eventos_calendario: { migrated: 0, errors: 0 },
      configuracion: { migrated: 0, errors: 0 }
    }
  }

  // Verificar si hay datos en localStorage
  hasLocalStorageData() {
    const keys = [
      'sistema_escolar_estudiantes',
      'sistema_escolar_materias', 
      'sistema_escolar_asistencias',
      'sistema_escolar_notas_personales',
      'calendar-events',
      'notassystem-theme'
    ]
    
    return keys.some(key => localStorage.getItem(key))
  }

  // Migrar estudiantes
  async migrateEstudiantes() {
    try {
      const estudiantesLocal = JSON.parse(localStorage.getItem('sistema_escolar_estudiantes') || '[]')
      
      if (estudiantesLocal.length === 0) {
        console.log('📝 No hay estudiantes en localStorage para migrar')
        return
      }

      const currentUser = auth.getCurrentUser()
      if (!currentUser) {
        throw new Error('No hay usuario autenticado')
      }

      console.log(`🔄 Migrando ${estudiantesLocal.length} estudiantes...`)

      for (const estudiante of estudiantesLocal) {
        try {
          const { error } = await supabase
            .from('estudiantes')
            .insert({
              nombre: estudiante.nombre,
              codigo: estudiante.codigo,
              grado: estudiante.grado || 'Sin especificar',
              usuario_id: currentUser.id,
              created_at: new Date().toISOString()
            })

          if (error) {
            console.error('❌ Error migrando estudiante:', estudiante.nombre, error)
            this.migrationResults.estudiantes.errors++
          } else {
            this.migrationResults.estudiantes.migrated++
          }
        } catch (error) {
          console.error('❌ Error migrando estudiante:', estudiante.nombre, error)
          this.migrationResults.estudiantes.errors++
        }
      }

      console.log(`✅ Estudiantes migrados: ${this.migrationResults.estudiantes.migrated}`)
    } catch (error) {
      console.error('❌ Error en migración de estudiantes:', error)
    }
  }

  // Migrar materias
  async migrateMaterias() {
    try {
      const materiasLocal = JSON.parse(localStorage.getItem('sistema_escolar_materias') || '[]')
      
      if (materiasLocal.length === 0) {
        console.log('📚 No hay materias en localStorage para migrar')
        return
      }

      const currentUser = auth.getCurrentUser()
      if (!currentUser) {
        throw new Error('No hay usuario autenticado')
      }

      console.log(`🔄 Migrando ${materiasLocal.length} materias...`)

      for (const materia of materiasLocal) {
        try {
          const { error } = await supabase
            .from('materias')
            .insert({
              nombre: materia.nombre,
              codigo: materia.codigo,
              grado: materia.grado,
              horario: materia.horario,
              color: materia.color,
              usuario_id: currentUser.id,
              created_at: new Date().toISOString()
            })

          if (error) {
            console.error('❌ Error migrando materia:', materia.nombre, error)
            this.migrationResults.materias.errors++
          } else {
            this.migrationResults.materias.migrated++
          }
        } catch (error) {
          console.error('❌ Error migrando materia:', materia.nombre, error)
          this.migrationResults.materias.errors++
        }
      }

      console.log(`✅ Materias migradas: ${this.migrationResults.materias.migrated}`)
    } catch (error) {
      console.error('❌ Error en migración de materias:', error)
    }
  }

  // Migrar asistencias
  async migrateAsistencias() {
    try {
      const asistenciasLocal = JSON.parse(localStorage.getItem('sistema_escolar_asistencias') || '[]')
      
      if (asistenciasLocal.length === 0) {
        console.log('📅 No hay asistencias en localStorage para migrar')
        return
      }

      const currentUser = auth.getCurrentUser()
      if (!currentUser) {
        throw new Error('No hay usuario autenticado')
      }

      console.log(`🔄 Migrando ${asistenciasLocal.length} asistencias...`)

      for (const asistencia of asistenciasLocal) {
        try {
          const { error } = await supabase
            .from('asistencias')
            .insert({
              estudiante_id: asistencia.estudiante_id,
              materia_id: asistencia.materia_id,
              usuario_id: currentUser.id,
              fecha: asistencia.fecha,
              estado: asistencia.estado,
              created_at: new Date().toISOString()
            })

          if (error) {
            console.error('❌ Error migrando asistencia:', error)
            this.migrationResults.asistencias.errors++
          } else {
            this.migrationResults.asistencias.migrated++
          }
        } catch (error) {
          console.error('❌ Error migrando asistencia:', error)
          this.migrationResults.asistencias.errors++
        }
      }

      console.log(`✅ Asistencias migradas: ${this.migrationResults.asistencias.migrated}`)
    } catch (error) {
      console.error('❌ Error en migración de asistencias:', error)
    }
  }

  // Migrar notas personales
  async migrateNotasPersonales() {
    try {
      const notasLocal = JSON.parse(localStorage.getItem('sistema_escolar_notas_personales') || '[]')
      
      if (notasLocal.length === 0) {
        console.log('📝 No hay notas personales en localStorage para migrar')
        return
      }

      const currentUser = auth.getCurrentUser()
      if (!currentUser) {
        throw new Error('No hay usuario autenticado')
      }

      console.log(`🔄 Migrando notas personales...`)

      // Combinar todas las notas en un solo texto
      const contenidoCompleto = notasLocal.join('\n\n')

      try {
        const { error } = await supabase
          .from('notas_personales')
          .upsert({
            usuario_id: currentUser.id,
            contenido: contenidoCompleto,
            updated_at: new Date().toISOString()
          })

        if (error) {
          console.error('❌ Error migrando notas personales:', error)
          this.migrationResults.notas_personales.errors++
        } else {
          this.migrationResults.notas_personales.migrated++
          console.log('✅ Notas personales migradas')
        }
      } catch (error) {
        console.error('❌ Error migrando notas personales:', error)
        this.migrationResults.notas_personales.errors++
      }
    } catch (error) {
      console.error('❌ Error en migración de notas personales:', error)
    }
  }

  // Migrar eventos del calendario
  async migrateEventosCalendario() {
    try {
      const eventosLocal = JSON.parse(localStorage.getItem('calendar-events') || '[]')
      
      if (eventosLocal.length === 0) {
        console.log('📅 No hay eventos de calendario en localStorage para migrar')
        return
      }

      const currentUser = auth.getCurrentUser()
      if (!currentUser) {
        throw new Error('No hay usuario autenticado')
      }

      console.log(`🔄 Migrando ${eventosLocal.length} eventos de calendario...`)

      for (const evento of eventosLocal) {
        try {
          const { error } = await supabase
            .from('eventos_calendario')
            .insert({
              usuario_id: currentUser.id,
              titulo: evento.title,
              descripcion: evento.description || '',
              fecha: evento.date,
              hora_inicio: evento.startTime || null,
              hora_fin: evento.endTime || null,
              tipo: evento.type || 'personal',
              recordatorio: evento.reminder || 15,
              ubicacion: evento.location || '',
              created_at: evento.createdAt || new Date().toISOString()
            })

          if (error) {
            console.error('❌ Error migrando evento:', evento.title, error)
            this.migrationResults.eventos_calendario.errors++
          } else {
            this.migrationResults.eventos_calendario.migrated++
          }
        } catch (error) {
          console.error('❌ Error migrando evento:', evento.title, error)
          this.migrationResults.eventos_calendario.errors++
        }
      }

      console.log(`✅ Eventos de calendario migrados: ${this.migrationResults.eventos_calendario.migrated}`)
    } catch (error) {
      console.error('❌ Error en migración de eventos de calendario:', error)
    }
  }

  // Migrar configuración de tema
  async migrateConfiguracion() {
    try {
      const temaLocal = localStorage.getItem('notassystem-theme')
      
      if (!temaLocal) {
        console.log('🎨 No hay configuración de tema en localStorage para migrar')
        return
      }

      const currentUser = auth.getCurrentUser()
      if (!currentUser) {
        throw new Error('No hay usuario autenticado')
      }

      console.log(`🔄 Migrando configuración de tema: ${temaLocal}`)

      try {
        const { error } = await supabase
          .from('configuracion_usuario')
          .upsert({
            usuario_id: currentUser.id,
            tema: temaLocal || 'light',
            configuraciones: {},
            updated_at: new Date().toISOString()
          })

        if (error) {
          console.error('❌ Error migrando configuración:', error)
          this.migrationResults.configuracion.errors++
        } else {
          this.migrationResults.configuracion.migrated++
          console.log('✅ Configuración migrada')
        }
      } catch (error) {
        console.error('❌ Error migrando configuración:', error)
        this.migrationResults.configuracion.errors++
      }
    } catch (error) {
      console.error('❌ Error en migración de configuración:', error)
    }
  }

  // Ejecutar migración completa
  async executeMigration() {
    console.log('🚀 Iniciando migración completa de localStorage a Supabase...')
    
    if (!this.hasLocalStorageData()) {
      console.log('ℹ️ No hay datos en localStorage para migrar')
      return { success: true, message: 'No hay datos para migrar' }
    }

    try {
      // Verificar autenticación
      if (!auth.isAuthenticated()) {
        throw new Error('Usuario no autenticado. Inicia sesión primero.')
      }

      // Ejecutar migraciones
      await this.migrateEstudiantes()
      await this.migrateMaterias()
      await this.migrateAsistencias()
      await this.migrateNotasPersonales()
      await this.migrateEventosCalendario()
      await this.migrateConfiguracion()

      // Resumen de migración
      const totalMigrated = Object.values(this.migrationResults).reduce((sum, result) => sum + result.migrated, 0)
      const totalErrors = Object.values(this.migrationResults).reduce((sum, result) => sum + result.errors, 0)

      console.log('📊 Resumen de migración:')
      console.log(`✅ Total migrado: ${totalMigrated}`)
      console.log(`❌ Total errores: ${totalErrors}`)
      console.log('📋 Detalles:', this.migrationResults)

      return {
        success: totalErrors === 0,
        message: `Migración completada: ${totalMigrated} elementos migrados, ${totalErrors} errores`,
        details: this.migrationResults
      }

    } catch (error) {
      console.error('❌ Error en migración completa:', error)
      return {
        success: false,
        message: 'Error en la migración: ' + error.message,
        details: this.migrationResults
      }
    }
  }

  // Limpiar localStorage después de migración exitosa
  async clearLocalStorage() {
    try {
      const keys = [
        'sistema_escolar_estudiantes',
        'sistema_escolar_materias',
        'sistema_escolar_asistencias',
        'sistema_escolar_notas_personales',
        'calendar-events',
        'notassystem-theme'
      ]

      keys.forEach(key => {
        localStorage.removeItem(key)
      })

      console.log('🧹 Datos de localStorage limpiados')
      return true
    } catch (error) {
      console.error('Error limpiando localStorage:', error)
      return false
    }
  }
}

// Función de utilidad para ejecutar la migración
export const executeCompleteMigration = async () => {
  const migration = new CompleteMigration()
  const result = await migration.executeMigration()
  
  if (result.success) {
    await migration.clearLocalStorage()
  }
  
  return result
}

export default CompleteMigration