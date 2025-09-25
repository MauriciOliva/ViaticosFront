// LoginPage.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/AuthHook';
import { Login } from '../components/Forms/Login'; // ← Importar el componente Login

const LoginPage = () => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogin = async (username, password) => {
        setLoading(true);
        setError('');

        try {
            const result = await login(username, password);
            
            if (result.success) {
                const from = location.state?.from?.pathname || '/';
                navigate(from, { replace: true });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Login 
            onSubmit={handleLogin}
            error={error}
            loading={loading}
        />
    );
};

export default LoginPage; // ← Exportación por defecto