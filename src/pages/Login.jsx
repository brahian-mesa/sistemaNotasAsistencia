import { Link } from 'react-router-dom';

export default function Login() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-white to-emerald-100 p-4">
            <div className="max-w-md w-full bg-white/90 rounded-2xl shadow-xl border border-white/40 p-8 flex flex-col items-center">
                <img src="/vite.svg" alt="Logo" className="w-16 h-16 mb-4" />
                <h2 className="text-2xl font-bold text-blue-800 mb-2 text-center">Iniciar sesión</h2>
                <form className="w-full flex flex-col gap-4 mt-4">
                    <input
                        type="text"
                        placeholder="Usuario o correo"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none text-base"
                        autoComplete="username"
                    />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none text-base"
                        autoComplete="current-password"
                    />
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow transition-colors text-lg mt-2"
                    >
                        Ingresar
                    </button>
                </form>
                <div className="mt-6 text-center text-sm text-gray-600">
                    ¿No tienes cuenta?{' '}
                    <Link to="/register" className="text-emerald-700 font-semibold hover:underline">Crear cuenta</Link>
                </div>
            </div>
            <footer className="mt-8 text-gray-400 text-xs text-center">
                &copy; {new Date().getFullYear()} Sistema Escolar
            </footer>
        </div>
    );
} 