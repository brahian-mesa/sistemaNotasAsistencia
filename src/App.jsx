import React, { useEffect, useState, Suspense, lazy } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout'
import FileNotification from './components/FileNotification'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingSpinner from './components/LoadingSpinner'
import MigrationStatus from './components/MigrationStatus'
import ConnectionStatus from './components/ConnectionStatus'
import DiagnosticPanel from './components/DiagnosticPanel'
import auth from './utils/auth'
import { checkDatabaseTables, initializeDefaultData, testDatabaseConnection } from './utils/check-database'

// Lazy loading de componentes
const Welcome = lazy(() => import('./pages/Welcome'))
const WelcomeBackup = lazy(() => import('./pages/WelcomeBackup'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Setup = lazy(() => import('./pages/Setup'))
const Home = lazy(() => import('./pages/Home'))
const CalendarioEscolar = lazy(() => import('./pages/CalendarioEscolar'))
const CalendarioPersonal = lazy(() => import('./pages/CalendarioPersonal'))
const Materias = lazy(() => import('./pages/Materias'))
const Asistencia = lazy(() => import('./pages/Asistencia'))
const NotasDocente = lazy(() => import('./pages/NotasDocente'))
const NotasPersonales = lazy(() => import('./pages/Notaspersonales'))
const YearConfiguration = lazy(() => import('./components/YearConfiguration'))
const DatabaseRelationshipTest = lazy(() => import('./components/DatabaseRelationshipTest'))
// const SupabaseTestPage = lazy(() => import('./pages/SupabaseTestPage'))

// Componente para proteger rutas privadas
function ProtectedRoute({ children, allowSetup = false, requireSetup = false }) {
  const isAuthenticated = auth.isAuthenticated();
  const currentUser = auth.getCurrentUser();

  console.log('🔍 ProtectedRoute - isAuthenticated:', isAuthenticated);
  console.log('🔍 ProtectedRoute - currentUser:', currentUser);
  console.log('🔍 ProtectedRoute - allowSetup:', allowSetup);
  console.log('🔍 ProtectedRoute - requireSetup:', requireSetup);

  if (!isAuthenticated) {
    console.log('🔄 Redirigiendo a /login (no autenticado)');
    return <Navigate to="/login" replace />;
  }

  // Solo requerir setup si se especifica explícitamente
  if (requireSetup && currentUser && !currentUser.setupCompleto && !allowSetup) {
    console.log('🔄 Redirigiendo a /setup (setup requerido)');
    return <Navigate to="/setup" replace />;
  }

  console.log('✅ Mostrando contenido protegido');
  return children;
}

// Componente para rutas públicas (solo si NO está autenticado)
function PublicRoute({ children }) {
  const isAuthenticated = auth.isAuthenticated();
  const currentUser = auth.getCurrentUser();
  
  if (isAuthenticated) {
    // Usuario autenticado siempre va al home, independientemente del setup
    console.log('🔄 Redirigiendo a /home (usuario autenticado)');
    return <Navigate to="/home" replace />;
  }

  return children;
}

// Componente para la página de bienvenida (siempre accesible)
function WelcomeRoute({ children }) {
  return children;
}

// Componente de carga mejorado
const AppLoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <LoadingSpinner size="xlarge" message="Cargando aplicación..." />
  </div>
);

function AppRoutes() {
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState({ checked: false, ready: false });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Inicializando aplicación...');
        
        // Verificar conexión a la base de datos
        const connectionTest = await testDatabaseConnection();
        if (!connectionTest.success) {
          console.error('❌ Error de conexión a la base de datos:', connectionTest.error);
          setDbStatus({ checked: true, ready: false, error: connectionTest.error });
          setIsLoading(false);
          return;
        }

        // Verificar estructura de la base de datos
        const dbCheck = await checkDatabaseTables();
        if (!dbCheck.allTablesExist) {
          console.warn('⚠️ Algunas tablas faltan en la base de datos');
          console.log('📋 Tablas faltantes:', dbCheck.missingTables);
          console.log('💡 Ejecuta el archivo supabase-schema.sql en Supabase SQL Editor');
        }

        // Inicializar datos por defecto
        await initializeDefaultData();

        setDbStatus({ checked: true, ready: true });
        console.log('✅ Aplicación inicializada correctamente');
      } catch (error) {
        console.error('❌ Error inicializando aplicación:', error);
        setDbStatus({ checked: true, ready: false, error: error.message });
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return <AppLoadingSpinner />;
  }

  // Mostrar error si la base de datos no está lista
  if (dbStatus.checked && !dbStatus.ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg border border-red-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Error de Base de Datos</h2>
            <p className="text-gray-600 mb-4">
              No se pudo conectar a la base de datos o faltan tablas necesarias.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700">
                <strong>Error:</strong> {dbStatus.error}
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Verifica tu configuración de Supabase y ejecuta el archivo supabase-schema.sql
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <MigrationStatus />
      <ConnectionStatus />
      <DiagnosticPanel />
      <Suspense fallback={<AppLoadingSpinner />}>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={
          <WelcomeRoute>
            <Welcome />
          </WelcomeRoute>
        } />
        <Route path="/welcome-backup" element={
          <WelcomeRoute>
            <WelcomeBackup />
          </WelcomeRoute>
        } />
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        <Route path="/setup" element={
          <ProtectedRoute allowSetup={true}>
            <Setup />
          </ProtectedRoute>
        } />

        {/* Rutas protegidas */}
        <Route path="/home" element={
          <ProtectedRoute>
            <FileNotification />
            <DashboardLayout>
              <Home />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/calendario" element={
          <ProtectedRoute>
            <FileNotification />
            <DashboardLayout>
              <CalendarioPersonal />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/calendario-escolar" element={
          <ProtectedRoute>
            <FileNotification />
            <DashboardLayout>
              <CalendarioEscolar />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/materias" element={
          <ProtectedRoute>
            <FileNotification />
            <DashboardLayout>
              <Materias />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/asistencia" element={
          <ProtectedRoute>
            <FileNotification />
            <DashboardLayout>
              <Asistencia />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/notas" element={
          <ProtectedRoute>
            <FileNotification />
            <DashboardLayout>
              <NotasDocente />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/notas-docente" element={
          <ProtectedRoute>
            <FileNotification />
            <DashboardLayout>
              <NotasDocente />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/notas-personales" element={
          <ProtectedRoute>
            <FileNotification />
            <DashboardLayout>
              <NotasPersonales />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/year-configuration" element={
          <ProtectedRoute>
            <FileNotification />
            <DashboardLayout>
              <YearConfiguration />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        {/* Ruta para pruebas de relaciones de base de datos */}
        <Route path="/database-test" element={
          <ProtectedRoute>
            <FileNotification />
            <DashboardLayout>
              <DatabaseRelationshipTest />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        {/* Ruta de diagnóstico */}
        
        {/* Ruta temporal para pruebas de Supabase - Comentada temporalmente */}
        {/* <Route path="/supabase-test" element={
          <ProtectedRoute>
            <SupabaseTestPage />
          </ProtectedRoute>
        } /> */}
      </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default AppRoutes;