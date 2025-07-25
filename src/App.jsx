import React, { useEffect, useState } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout'
import FileNotification from './components/FileNotification'
import auth from './utils/auth'
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import CalendarioEscolar from './pages/CalendarioEscolar'
import CalendarioPersonal from './pages/CalendarioPersonal'
import Materias from './pages/Materias'
import Asistencia from './pages/Asistencia'
import NotasDocente from './pages/NotasDocente'
import NotasPersonales from './pages/Notaspersonales'

// Componente para proteger rutas privadas
function ProtectedRoute({ children }) {
  const isAuthenticated = auth.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Componente para rutas públicas (solo si NO está autenticado)
function PublicRoute({ children }) {
  const isAuthenticated = auth.isAuthenticated();

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

function AppRoutes() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar autenticación al cargar la app
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={
        <PublicRoute>
          <Welcome />
        </PublicRoute>
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
    </Routes>
  );
}

export default AppRoutes;