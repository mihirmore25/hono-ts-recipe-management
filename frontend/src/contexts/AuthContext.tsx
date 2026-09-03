import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    useCallback,
    type ReactNode,
} from "react";
import type { User } from "../types";
import { userApi } from "../utils/api";

interface AuthContextValue {
    user: User | null;
    login: (userData: User, token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(() =>
        localStorage.getItem("token"),
    );

    const [user, setUser] = useState<User | null>(() => {
        try {
            const storedToken = localStorage.getItem("token");
            const storedUser = localStorage.getItem("user");
            if (storedToken && storedUser) {
                return JSON.parse(storedUser) as User;
            }
        } catch (e) {
            // ignore parse errors
        }
        return null;
    });

    useEffect(() => {
        if (!token) return;

        const loadProfile = async () => {
            try {
                const response = await userApi.getProfile();
                const profile = response.data?.data;

                if (profile) {
                    setUser(profile);
                    localStorage.setItem("user", JSON.stringify(profile));
                }
            } catch (error) {
                console.error("Failed to refresh user profile:", error);
            }
        };

        loadProfile();
    }, [token]);

    const login = useCallback((userData: User, authToken: string) => {
        if (!userData || !authToken) {
            throw new Error("Cannot create a session without user credentials.");
        }
        localStorage.setItem("token", authToken);
        localStorage.setItem("user", JSON.stringify(userData));
        setToken(authToken);
        setUser(userData);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
    }, []);

    const value = useMemo(
        () => ({
            user,
            login,
            logout,
            isAuthenticated: Boolean(token && user),
        }),
        [user, token],
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
