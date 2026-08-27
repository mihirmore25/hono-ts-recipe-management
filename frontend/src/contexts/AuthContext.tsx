import {
    createContext,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import type { User } from "../types";

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

    const login = (userData: User, authToken: string) => {
        localStorage.setItem("token", authToken);
        localStorage.setItem("user", JSON.stringify(userData));
        setToken(authToken);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
    };

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
