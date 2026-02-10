import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const login = (username, password) => {
        // Simulación de autenticación
        // En un futuro, esto se conectaría a un backend
        if (username === 'admin' && password === 'admin123') {
            const userData = { username, role: 'admin', name: 'Administrador' };
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            return { success: true };
        } else if (username === 'tecnico' && password === 'tecnico123') {
            const userData = { username, role: 'technician', name: 'Técnico de Laboratorio' };
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            return { success: true };
        } else {
            return { success: false, message: 'Credenciales incorrectas' };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
