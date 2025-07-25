import { Link } from 'react-router-dom';

export default function Welcome() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-white to-emerald-100 p-4">
            <div className="max-w-lg w-full bg-white/90 rounded-2xl shadow-xl border border-white/40 p-8 flex flex-col items-center">
                <img src="/vite.svg" alt="Logo" className="w-20 h-20 mb-4" />
                <h1 className="text-3xl font-bold text-blue-800 mb-2 text-center">Sistema de Notas y Asistencia Escolar</h1>
                <p className="text-gray-700 text-center mb-6 text-lg">
                    Bienvenido al sistema digital para docentes. Aquí podrás gestionar la asistencia, calificaciones y estadísticas de tus estudiantes de manera fácil, rápida y segura. Exporta reportes, visualiza calendarios y mantén el control de tu grupo escolar desde cualquier dispositivo.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <Link to="/login" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-center shadow transition-colors text-lg">Iniciar sesión</Link>
                    <Link to="/register" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg text-center shadow transition-colors text-lg">Crear cuenta</Link>
                </div>
            </div>
            <footer className="mt-8 text-gray-400 text-xs text-center">
                &copy; {new Date().getFullYear()} Sistema Escolar. Desarrollado por un estudiante de software.
            </footer>
        </div>
    );
} 