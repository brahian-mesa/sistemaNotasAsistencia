import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import auth from '../utils/auth';

export default function Login() {
    const [formData, setFormData] = useState({
        usuario: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError(''); // Limpiar error al escribir
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = auth.login(formData);

        if (result.success) {
            // Redirigir al home
            navigate('/home');
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-white to-emerald-100 p-4">
            <div className="max-w-md w-full bg-white/90 rounded-2xl shadow-xl border border-white/40 p-8 flex flex-col items-center">
                <img src="/vite.svg" alt="Logo" className="w-16 h-16 mb-4" />
                <h2 className="text-2xl font-bold text-blue-800 mb-2 text-center">Iniciar sesión</h2>

                {error && (
                    <div className="w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 mt-4">
                    <input
                        type="text"
                        name="usuario"
                        placeholder="Usuario o correo"
                        value={formData.usuario}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none text-base"
                        autoComplete="username"
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Contraseña"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none text-base"
                        autoComplete="current-password"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg shadow transition-colors text-lg mt-2"
                    >
                        {loading ? 'Iniciando sesión...' : 'Ingresar'}
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