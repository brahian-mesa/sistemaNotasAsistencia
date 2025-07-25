import { Routes, Route, useLocation } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout'
import FileNotification from './components/FileNotification'
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

function AppRoutes() {
  const location = useLocation();
  const isPublic =
    location.pathname === '/' ||
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/register');

  if (isPublic) {
    return (
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    );
  }

  return (
    <>
      <FileNotification />
      <DashboardLayout>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/calendario" element={<CalendarioPersonal />} />
          <Route path="/calendario-escolar" element={<CalendarioEscolar />} />
          <Route path="/materias" element={<Materias />} />
          <Route path="/asistencia" element={<Asistencia />} />
          <Route path="/notas" element={<NotasDocente />} />
          <Route path="/notas-docente" element={<NotasDocente />} />
          <Route path="/notas-personales" element={<NotasPersonales />} />
        </Routes>
      </DashboardLayout>
    </>
  );
}

export default AppRoutes;