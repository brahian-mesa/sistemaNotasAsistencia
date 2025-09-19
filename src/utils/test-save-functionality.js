// Script de prueba para verificar funcionalidad de guardado
// Ejecutar en la consola del navegador para probar todas las funciones

import db from './database.js';
import auth from './auth.js';

class SaveFunctionalityTest {
  constructor() {
    this.results = [];
    this.currentUser = auth.getCurrentUser();
  }

  async runAllTests() {
    console.log('🧪 INICIANDO PRUEBAS DE FUNCIONALIDAD DE GUARDADO');
    console.log('👤 Usuario actual:', this.currentUser?.nombre, '(ID:', this.currentUser?.id, ')');
    console.log('📅 Fecha:', new Date().toLocaleString());
    console.log('='.repeat(60));

    try {
      await this.testMateriasSave();
      await this.testEstudiantesSave();
      await this.testAsistenciaSave();
      await this.testNotasSave();
      await this.testCalendarioSave();
      
      this.showResults();
    } catch (error) {
      console.error('❌ Error en las pruebas:', error);
    }
  }

  async testMateriasSave() {
    console.log('\n📚 PROBANDO GUARDADO DE MATERIAS...');
    
    try {
      // Crear materia de prueba
      const materiaTest = {
        nombre: 'Matemáticas - Prueba',
        codigo: 'MAT-TEST',
        grado: this.currentUser?.grado || '5B',
        horario: 'Lunes, Miércoles',
        color: 'bg-blue-100 text-blue-800 border-blue-200'
      };

      const materiaGuardada = await db.guardarMateria(materiaTest);
      
      if (materiaGuardada && materiaGuardada.id) {
        console.log('✅ Materia guardada correctamente:', materiaGuardada.nombre);
        this.results.push({ test: 'Materias', status: 'PASS', details: materiaGuardada.nombre });
        
        // Limpiar - eliminar materia de prueba
        await db.eliminarMateria(materiaGuardada.id);
        console.log('🧹 Materia de prueba eliminada');
      } else {
        throw new Error('No se pudo guardar la materia');
      }
    } catch (error) {
      console.error('❌ Error en prueba de materias:', error);
      this.results.push({ test: 'Materias', status: 'FAIL', details: error.message });
    }
  }

  async testEstudiantesSave() {
    console.log('\n👥 PROBANDO GUARDADO DE ESTUDIANTES...');
    
    try {
      // Crear estudiante de prueba
      const estudianteTest = {
        nombre: 'Estudiante Prueba',
        codigo: 'TEST001',
        grado: this.currentUser?.grado || '5B'
      };

      const estudianteGuardado = await db.guardarEstudiante(estudianteTest);
      
      if (estudianteGuardado && estudianteGuardado.id) {
        console.log('✅ Estudiante guardado correctamente:', estudianteGuardado.nombre);
        this.results.push({ test: 'Estudiantes', status: 'PASS', details: estudianteGuardado.nombre });
        
        // Limpiar - eliminar estudiante de prueba
        await db.eliminarEstudiante(estudianteGuardado.id);
        console.log('🧹 Estudiante de prueba eliminado');
      } else {
        throw new Error('No se pudo guardar el estudiante');
      }
    } catch (error) {
      console.error('❌ Error en prueba de estudiantes:', error);
      this.results.push({ test: 'Estudiantes', status: 'FAIL', details: error.message });
    }
  }

  async testAsistenciaSave() {
    console.log('\n📊 PROBANDO GUARDADO DE ASISTENCIA...');
    
    try {
      // Obtener una materia existente
      const materias = await db.getMaterias();
      if (materias.length === 0) {
        console.log('⚠️ No hay materias para probar asistencia');
        this.results.push({ test: 'Asistencia', status: 'SKIP', details: 'No hay materias' });
        return;
      }

      // Obtener un estudiante existente
      const estudiantes = await db.getEstudiantes();
      if (estudiantes.length === 0) {
        console.log('⚠️ No hay estudiantes para probar asistencia');
        this.results.push({ test: 'Asistencia', status: 'SKIP', details: 'No hay estudiantes' });
        return;
      }

      const fechaTest = new Date().toISOString().split('T')[0];
      const asistenciasTest = materias.map(materia => ({
        estudiante_id: estudiantes[0].id,
        materia_id: materia.id,
        fecha: fechaTest,
        estado: 'presente'
      }));

      const resultado = await db.guardarAsistenciaDia(fechaTest, asistenciasTest);
      
      if (resultado) {
        console.log('✅ Asistencia guardada correctamente para', fechaTest);
        this.results.push({ test: 'Asistencia', status: 'PASS', details: `${asistenciasTest.length} registros` });
      } else {
        throw new Error('No se pudo guardar la asistencia');
      }
    } catch (error) {
      console.error('❌ Error en prueba de asistencia:', error);
      this.results.push({ test: 'Asistencia', status: 'FAIL', details: error.message });
    }
  }

  async testNotasSave() {
    console.log('\n📝 PROBANDO GUARDADO DE NOTAS...');
    
    try {
      // Probar tipos de nota
      const tiposNotaTest = {
        1: [
          { id: 1, titulo: 'Quiz 1', descripcion: 'Prueba de conocimiento' },
          { id: 2, titulo: 'Taller', descripcion: 'Actividad práctica' }
        ],
        usuario_id: this.currentUser?.id,
        usuario_nombre: this.currentUser?.nombre,
        ultima_actualizacion: new Date().toISOString()
      };

      const tiposGuardados = await db.guardarTiposNotaPeriodo(tiposNotaTest);
      
      if (tiposGuardados) {
        console.log('✅ Tipos de nota guardados correctamente');
        
        // Probar notas detalladas
        const notasTest = {
          'materia_test': {
            'estudiante_test': {
              'periodo1': [
                { id: 1, tipoId: 1, titulo: 'Quiz 1', valor: 4.5, fecha: '2025-01-27' }
              ]
            }
          },
          usuario_id: this.currentUser?.id,
          usuario_nombre: this.currentUser?.nombre,
          ultima_actualizacion: new Date().toISOString()
        };

        const notasGuardadas = await db.guardarNotasDetalladas(notasTest);
        
        if (notasGuardadas) {
          console.log('✅ Notas detalladas guardadas correctamente');
          this.results.push({ test: 'Notas', status: 'PASS', details: 'Tipos y notas guardados' });
        } else {
          throw new Error('No se pudieron guardar las notas detalladas');
        }
      } else {
        throw new Error('No se pudieron guardar los tipos de nota');
      }
    } catch (error) {
      console.error('❌ Error en prueba de notas:', error);
      this.results.push({ test: 'Notas', status: 'FAIL', details: error.message });
    }
  }

  async testCalendarioSave() {
    console.log('\n📅 PROBANDO GUARDADO DE CALENDARIO...');
    
    try {
      const eventoTest = {
        titulo: 'Evento de Prueba',
        descripcion: 'Evento creado para probar funcionalidad',
        fecha: new Date().toISOString().split('T')[0],
        hora_inicio: '09:00',
        hora_fin: '10:00',
        tipo: 'personal',
        recordatorio: 15,
        ubicacion: 'Sala de pruebas'
      };

      const eventoGuardado = await db.guardarEventoCalendario(eventoTest);
      
      if (eventoGuardado && eventoGuardado.id) {
        console.log('✅ Evento guardado correctamente:', eventoGuardado.titulo);
        this.results.push({ test: 'Calendario', status: 'PASS', details: eventoGuardado.titulo });
        
        // Limpiar - eliminar evento de prueba
        await db.eliminarEventoCalendario(eventoGuardado.id);
        console.log('🧹 Evento de prueba eliminado');
      } else {
        throw new Error('No se pudo guardar el evento');
      }
    } catch (error) {
      console.error('❌ Error en prueba de calendario:', error);
      this.results.push({ test: 'Calendario', status: 'FAIL', details: error.message });
    }
  }

  showResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADOS DE LAS PRUEBAS');
    console.log('='.repeat(60));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    
    console.log(`✅ Exitosas: ${passed}`);
    console.log(`❌ Fallidas: ${failed}`);
    console.log(`⚠️ Omitidas: ${skipped}`);
    console.log(`📊 Total: ${this.results.length}`);
    
    console.log('\n📋 DETALLES:');
    this.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${icon} ${result.test}: ${result.details}`);
    });
    
    if (failed === 0) {
      console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON! El sistema de guardado está funcionando correctamente.');
    } else {
      console.log('\n⚠️ Algunas pruebas fallaron. Revisar los errores anteriores.');
    }
  }
}

// Función para ejecutar las pruebas
window.testSaveFunctionality = async () => {
  const tester = new SaveFunctionalityTest();
  await tester.runAllTests();
};

// Instrucciones de uso
console.log(`
🧪 SCRIPT DE PRUEBAS DE GUARDADO CARGADO

Para ejecutar las pruebas, escribe en la consola:
testSaveFunctionality()

Las pruebas verificarán:
- ✅ Guardado de materias
- ✅ Guardado de estudiantes  
- ✅ Guardado de asistencia
- ✅ Guardado de notas
- ✅ Guardado de eventos de calendario

Nota: Las pruebas crearán y eliminarán datos temporales.
`);

export default SaveFunctionalityTest;