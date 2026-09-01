import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { authApi, userApi } from "../../utils/api";

interface AuthFormProps {
    mode: "login" | "register" | "forgot" | "reset";
    token?: string;
}

export const AuthForm = ({ mode, token }: AuthFormProps) => {
    const [form, setForm] = useState({ username: "", email: "", password: "" });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const resetToken = token ?? params.token;
    const { login } = useAuth();
    const apiBaseUrl =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const googleToken = query.get("auth_token");

        if (googleToken && mode === "login") {
            setSubmitting(true);
            localStorage.setItem("token", googleToken);
            userApi
                .getProfile()
                .then((response) => {
                    const profile = response.data?.data;
                    if (!profile) throw new Error("Google profile was not returned.");
                    login(profile, googleToken);
                    navigate("/", { replace: true });
                })
                .catch(() => {
                    localStorage.removeItem("token");
                    setError("Google sign-in failed. Please try again.");
                    navigate("/login", { replace: true });
                })
                .finally(() => setSubmitting(false));
            return;
        }

        if (query.get("error") === "google_auth_failed") {
            setError("Google sign-in failed. Please try again.");
        }
    }, [location.search, login, mode, navigate]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setMessage("");
        setError("");
        setSubmitting(true);

        try {
            if (mode === "register") {
                await authApi.register({
                    username: form.username,
                    email: form.email,
                    password: form.password,
                });
                setMessage("Account created successfully. Please login.");
                navigate("/login");
            } else if (mode === "login") {
                const response = await authApi.login({
                    email: form.email,
                    password: form.password,
                });
                const responseData = response.data;
                const user =
                    responseData?.user ??
                    (Array.isArray(responseData?.data)
                        ? responseData.data[0]
                        : responseData?.data?.user ?? responseData?.data);
                const authToken = response.data?.token;

                if (!user || typeof user !== "object" || !authToken) {
                    throw new Error("Invalid login response from server.");
                }

                login(user, authToken);
                navigate("/");
            } else if (mode === "forgot") {
                await authApi.forgotPassword({ email: form.email });
                setMessage("Password reset email request submitted.");
            } else if (mode === "reset" && resetToken) {
                await authApi.resetPassword(resetToken, {
                    password: form.password,
                });
                setMessage("Password reset successful. Please login again.");
                navigate("/login");
            }
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    "Something went wrong",
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 px-3 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
            <div className="mx-auto flex max-w-7xl flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:rounded-[2rem] lg:flex-row">
                <div className="flex-1 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.3),_transparent_55%)] p-6 sm:p-8 lg:p-12">
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
                        {mode === "forgot"
                            ? "Forgot password"
                            : mode === "reset"
                              ? "Reset password"
                              : mode === "register"
                                ? "Create account"
                                : "Welcome back"}
                    </p>
                    <h1 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
                        {mode === "forgot"
                            ? "Recover your account"
                            : mode === "reset"
                              ? "Set a new password"
                              : mode === "register"
                                ? "Join RecipeHub"
                                : "Sign in to continue"}
                    </h1>
                    <p className="mt-3 text-slate-600">
                        {mode === "forgot"
                            ? "Enter your email and we will send recovery instructions."
                            : "Use your email and password to access your recipe workspace."}
                    </p>
                </div>
                <form
                    onSubmit={handleSubmit}
                    className="flex-1 space-y-4 p-6 sm:space-y-5 sm:p-8 lg:p-12"
                >
                    {mode === "register" ? (
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Username
                            </label>
                            <input
                                value={form.username}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        username: e.target.value,
                                    })
                                }
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-0 focus:border-amber-500"
                                placeholder="Enter username"
                                required
                            />
                        </div>
                    ) : null}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Email
                        </label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) =>
                                setForm({ ...form, email: e.target.value })
                            }
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-amber-500"
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    {mode !== "forgot" ? (
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Password
                            </label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        password: e.target.value,
                                    })
                                }
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-amber-500"
                                placeholder="Enter password"
                                required
                            />
                        </div>
                    ) : null}
                    {message ? (
                        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {message}
                        </p>
                    ) : null}
                    {error ? (
                        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {error}
                        </p>
                    ) : null}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-4 py-3 font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {submitting ? (
                            <>
                                <span
                                    className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                                    aria-hidden="true"
                                />
                                <span>
                                    {mode === "register"
                                        ? "Creating account..."
                                        : "Logging in..."}
                                </span>
                            </>
                        ) : mode === "forgot" ? (
                            "Send reset link"
                        ) : mode === "reset" ? (
                            "Save password"
                        ) : mode === "register" ? (
                            "Create account"
                        ) : (
                            "Log in"
                        )}
                    </button>
                    {(mode === "login" || mode === "register") ? (
                        <>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                                <span className="h-px flex-1 bg-slate-200" />
                                OR
                                <span className="h-px flex-1 bg-slate-200" />
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    (window.location.href = `${apiBaseUrl}/auth/google`)
                                }
                                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        fill="#4285F4"
                                        d="M21.35 12.27c0-.73-.07-1.43-.2-2.1H12v3.98h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.27Z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.55 0-4.71-1.72-5.49-4.03H3.27v2.53A9.74 9.74 0 0 0 12 21.75Z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M6.51 13.83A5.85 5.85 0 0 1 6.2 12c0-.64.11-1.26.31-1.83V7.64H3.27A9.74 9.74 0 0 0 2.25 12c0 1.57.38 3.05 1.02 4.36l3.24-2.53Z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 6.14c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.25 14.63 2.25 12 2.25a9.74 9.74 0 0 0-8.73 5.39l3.24 2.53c.78-2.31 2.94-4.03 5.49-4.03Z"
                                    />
                                </svg>
                                Continue with Google
                            </button>
                        </>
                    ) : null}
                    <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                        {mode !== "login" ? (
                            <Link
                                to="/login"
                                className="font-medium text-amber-600"
                            >
                                Back to login
                            </Link>
                        ) : (
                            <Link
                                to="/forgot-password"
                                className="font-medium text-amber-600"
                            >
                                Forgot password?
                            </Link>
                        )}
                        {mode !== "register" ? (
                            <Link
                                to="/register"
                                className="font-medium text-amber-600"
                            >
                                Create account
                            </Link>
                        ) : null}
                    </div>
                </form>
            </div>
        </div>
    );
};
