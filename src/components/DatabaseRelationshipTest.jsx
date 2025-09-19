import React, { useState, useEffect } from 'react';
import supabase from '../utils/supabase';
import auth from '../utils/auth';

const DatabaseRelationshipTest = () => {
  const [testResults, setTestResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    setCurrentUser(auth.getCurrentUser());
  }, []);

  const runRelationshipTests = async () => {
    setIsLoading(true);
    const results = {};

    try {
      // Test 1: Verificar estructura de tablas
      console.log('🔍 Verificando estructura de tablas...');
      const tables = ['usuarios', 'estudiantes', 'materias', 'asistencias', 'notas_individuales'];
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          if (error) {
            results[table] = { exists: false, error: error.message };
          } else {
            results[table] = { exists: true, count: data?.length || 0 };
          }
        } catch (error) {
          results[table] = { exists: false, error: error.message };
        }
      }

      // Test 2: Verificar relaciones (foreign keys)
      console.log('🔗 Verificando relaciones...');
      try {
        const { data: fkData, error: fkError } = await supabase.rpc('get_foreign_keys');
        if (fkError) {
          // Si la función no existe, usar query directa
          const { data, error } = await supabase
            .from('information_schema.table_constraints')
            .select('table_name, constraint_name, constraint_type')
            .eq('constraint_type', 'FOREIGN KEY')
            .eq('table_schema', 'public');
          
          results.foreign_keys = { exists: !error, data: data || [] };
        } else {
          results.foreign_keys = { exists: true, data: fkData };
        }
      } catch (error) {
        results.foreign_keys = { exists: false, error: error.message };
      }

      // Test 3: Verificar datos de usuario actual
      if (currentUser) {
        console.log('👤 Verificando datos del usuario actual...');
        
        // Estudiantes del usuario
        const { data: estudiantes, error: estudiantesError } = await supabase
          .from('estudiantes')
          .select('*')
          .eq('usuario_id', currentUser.id);
        
        results.user_estudiantes = { 
          exists: !estudiantesError, 
          count: estudiantes?.length || 0,
          error: estudiantesError?.message 
        };

        // Materias del usuario
        const { data: materias, error: materiasError } = await supabase
          .from('materias')
          .select('*')
          .eq('usuario_id', currentUser.id);
        
        results.user_materias = { 
          exists: !materiasError, 
          count: materias?.length || 0,
          error: materiasError?.message 
        };

        // Asistencias del usuario
        const { data: asistencias, error: asistenciasError } = await supabase
          .from('asistencias')
          .select('*')
          .eq('usuario_id', currentUser.id);
        
        results.user_asistencias = { 
          exists: !asistenciasError, 
          count: asistencias?.length || 0,
          error: asistenciasError?.message 
        };
      }

      // Test 4: Probar inserción de datos de prueba
      console.log('🧪 Probando inserción de datos...');
      if (currentUser) {
        try {
          // Crear estudiante de prueba
          const { data: testEstudiante, error: testError } = await supabase
            .from('estudiantes')
            .insert({
              nombre: 'Estudiante Prueba',
              codigo: 'TEST001',
              grado: 'Test',
              usuario_id: currentUser.id
            })
            .select()
            .single();

          if (!testError && testEstudiante) {
            results.test_insertion = { success: true, estudiante_id: testEstudiante.id };
            
            // Limpiar datos de prueba
            await supabase
              .from('estudiantes')
              .delete()
              .eq('id', testEstudiante.id);
          } else {
            results.test_insertion = { success: false, error: testError?.message };
          }
        } catch (error) {
          results.test_insertion = { success: false, error: error.message };
        }
      }

    } catch (error) {
      console.error('❌ Error ejecutando tests:', error);
      results.general_error = error.message;
    }

    setTestResults(results);
    setIsLoading(false);
  };

  const getStatusIcon = (result) => {
    if (result.exists === false || result.success === false) return '❌';
    if (result.exists === true || result.success === true) return '✅';
    return '⚠️';
  };

  const getStatusColor = (result) => {
    if (result.exists === false || result.success === false) return 'text-red-600';
    if (result.exists === true || result.success === true) return 'text-green-600';
    return 'text-yellow-600';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Prueba de Relaciones de Base de Datos
        </h2>
        <p className="text-gray-600">
          Esta herramienta verifica que las relaciones entre tablas estén funcionando correctamente.
        </p>
      </div>

      {currentUser && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800">Usuario Actual:</h3>
          <p className="text-blue-600">
            {currentUser.nombre} ({currentUser.usuario}) - ID: {currentUser.id}
          </p>
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={runRelationshipTests}
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Ejecutando Pruebas...' : 'Ejecutar Pruebas de Relaciones'}
        </button>
      </div>

      {Object.keys(testResults).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">Resultados de las Pruebas:</h3>
          
          {Object.entries(testResults).map(([testName, result]) => (
            <div key={testName} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-700 capitalize">
                  {testName.replace(/_/g, ' ')}
                </h4>
                <span className={`text-lg ${getStatusColor(result)}`}>
                  {getStatusIcon(result)}
                </span>
              </div>
              
              <div className="text-sm text-gray-600">
                {result.exists !== undefined && (
                  <p>Existe: {result.exists ? 'Sí' : 'No'}</p>
                )}
                {result.success !== undefined && (
                  <p>Éxito: {result.success ? 'Sí' : 'No'}</p>
                )}
                {result.count !== undefined && (
                  <p>Registros: {result.count}</p>
                )}
                {result.error && (
                  <p className="text-red-600">Error: {result.error}</p>
                )}
                {result.data && (
                  <p>Datos: {JSON.stringify(result.data).substring(0, 100)}...</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">Instrucciones:</h3>
        <ol className="list-decimal list-inside text-yellow-700 space-y-1">
          <li>Ejecuta el archivo <code>database-relationships-fix.sql</code> en Supabase SQL Editor</li>
          <li>Ejecuta las pruebas para verificar que las relaciones funcionen</li>
          <li>Si hay errores, revisa la consola del navegador para más detalles</li>
          <li>Las relaciones deben mostrar ✅ para funcionar correctamente</li>
        </ol>
      </div>
    </div>
  );
};

export default DatabaseRelationshipTest;