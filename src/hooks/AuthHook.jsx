import { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const getApiBaseUrl = () => {
        if (import.meta.env.MODE === 'development') {
            return import.meta.env.VITE_API_BASE_URL || 'http://localhost:2600';
        }

        let productionUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;

        if (productionUrl.startsWith('http://')) {
            productionUrl = productionUrl.replace('http://', 'https://');
        }
        
        return productionUrl;
    };

    const API_BASE_URL = getApiBaseUrl();

    useEffect(() => {
        axios.interceptors.request.use((config) => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        // Configurar interceptor para manejar errores de autenticación
        axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401 || error.response?.status === 403) {
                    console.warn('Error de autenticación, haciendo logout');
                    logout();
                }
                return Promise.reject(error);
            }
        );
    }, []);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');

            if (token && userData) {
                // ✅ VERIFICACIÓN SIMPLE - sin endpoint /verify
                // Solo verifica que existan token y userData
                const user = JSON.parse(userData);
                
                // Verificación básica del token (estructura JWT)
                if (token && typeof token === 'string' && token.split('.').length === 3) {
                    setUser(user);
                } else {
                    console.warn('Token con formato inválido');
                    logout();
                }
            }
            // Si no hay token/userData, el estado se mantiene en null
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            // Limpiar datos corruptos
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (username, password) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
                username,
                password
            });

            const data = response.data;

            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                setUser(data.user);
                
                return {
                    success: true,
                    user: data.user,
                    token: data.token,
                    message: data.message
                };
            } else {
                throw new Error(data.message || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error en login:', error);
            throw new Error(
                error.response?.data?.message || 
                error.message || 
                'Error al iniciar sesión'
            );
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        
        return { success: true, message: 'Sesión cerrada correctamente' };
    };

    // Función para verificar el token con el backend (opcional)
    const verifyToken = async () => {
        try {
            // Si quieres verificar el token, puedes hacer una petición a una ruta protegida
            const response = await axios.get(`${API_BASE_URL}/api/v1/viaticos`); // o cualquier ruta protegida
            return response.data.success;
        } catch (error) {
            console.error('Error verificando token:', error);
            return false;
        }
    };

    const value = {
        user,
        isLoading,
        login,
        logout,
        verifyToken,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};