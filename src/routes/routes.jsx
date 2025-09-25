// routes.jsx
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "../hooks/AuthHook"; // ← Ahora importa AuthProvider
import LoginPage from "../pages/LoginPage";
import { ViaticosPage } from "../pages/ViaticosPage";
import { LoadingSpinner } from "../components/atomos/LoadingSnipper";

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
        return <LoadingSpinner />;
    }
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Componente para rutas públicas cuando ya está autenticado
const PublicRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return !isAuthenticated ? children : <Navigate to="/" replace />;
};

const router = createBrowserRouter([
    {
        path: "/login",
        element: (
            <PublicRoute>
                <LoginPage />
            </PublicRoute>
        )
    },
    {
        path: "/",
        element: (
            <ProtectedRoute>
                <ViaticosPage />
            </ProtectedRoute>
        )
    },
    {
        path: "*",
        element: <Navigate to="/" replace />
    }
]);

// ENVOLVER con AuthProvider
const MyRouter = () => (
    <AuthProvider>
        <RouterProvider router={router} />
    </AuthProvider>
);

export default MyRouter;