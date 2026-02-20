import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User } from 'lucide-react';

const Login = () => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (isRegistering) {
            try {
                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, username, password })
                });
                const data = await res.json();

                if (data.success) {
                    setSuccessMessage('Cuenta creada exitosamente. Iniciando sesión...');
                    setTimeout(async () => {
                        const loginSuccess = await login(username, password);
                        if (loginSuccess) window.location.href = from;
                    }, 1500);
                } else {
                    setError(data.message || 'Error al registrar la cuenta');
                }
            } catch (err) {
                setError('Error de conexión con el servidor');
            }
        } else {
            const success = await login(username, password);
            if (success) {
                window.location.href = from;
            } else {
                setError('Usuario o contraseña incorrectos');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <div className="glass-panel p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gradient mb-2">Gestión Genómica</h1>
                    <p className="text-slate-400">{isRegistering ? 'Registro de Nuevo Técnico' : 'Acceso a Técnicos'}</p>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-3 rounded mb-4 text-sm text-center">
                        {error}
                    </div>
                )}
                {successMessage && (
                    <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 p-3 rounded mb-4 text-sm text-center">
                        {successMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {isRegistering && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Nombre Completo</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="Ej: Juan Pérez"
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Usuario</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-slate-500" />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="usuario"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Contraseña</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-500" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium py-2 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-500/20 mt-4"
                    >
                        {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
                    </button>

                    <div className="text-center mt-6">
                        <button
                            type="button"
                            onClick={() => {
                                setIsRegistering(!isRegistering);
                                setError('');
                                setSuccessMessage('');
                            }}
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
