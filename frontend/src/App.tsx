import { useEffect, useLayoutEffect, useRef } from "react";
import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
    useNavigationType,
    useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Navbar } from "./components/layout/Navbar";
import { HomePage } from "./components/pages/HomePage";
import { AuthForm } from "./components/auth/AuthForm";
import { RecipeForm } from "./components/recipes/RecipeForm";
import { RecipeDetailPage } from "./components/pages/RecipeDetailPage";
import { AdminUsersPage } from "./components/admin/AdminUsersPage";
import { NotFoundPage } from "./components/pages/NotFoundPage";
import { ProfilePage } from "./components/pages/ProfilePage";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, user } = useAuth();
    return isAuthenticated && user?.role === "admin" ? (
        <>{children}</>
    ) : (
        <Navigate to="/" replace />
    );
};

const ScrollToTop = () => {
    const location = useLocation();
    const navigationType = useNavigationType();
    const positions = useRef(new Map<string, number>());

    useEffect(() => {
        const previousRestoration = window.history.scrollRestoration;
        window.history.scrollRestoration = "manual";

        return () => {
            window.history.scrollRestoration = previousRestoration;
        };
    }, []);

    useLayoutEffect(() => {
        const savedPosition = positions.current.get(location.key) ?? 0;
        const position = navigationType === "POP" ? savedPosition : 0;

        window.scrollTo({ top: position, left: 0, behavior: "auto" });

        return () => {
            positions.current.set(location.key, window.scrollY);
        };
    }, [location.key, navigationType]);

    return null;
};

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <ScrollToTop />
            <Navbar />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<AuthForm mode="login" />} />
                <Route
                    path="/register"
                    element={<AuthForm mode="register" />}
                />
                <Route
                    path="/forgot-password"
                    element={<AuthForm mode="forgot" />}
                />
                <Route
                    path="/reset-password/:token"
                    element={<AuthForm mode="reset" />}
                />
                <Route
                    path="/recipes/new"
                    element={
                        <ProtectedRoute>
                            <RecipeForm />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/recipes/:id"
                    element={
                        <ProtectedRoute>
                            <RecipeDetailPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/recipes/:id/edit"
                    element={
                        <ProtectedRoute>
                            <RecipeForm />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/profile/:id"
                    element={
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/users"
                    element={
                        <AdminRoute>
                            <AdminUsersPage />
                        </AdminRoute>
                    }
                />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
};

function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}

export default App;
