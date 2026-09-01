import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { authApi } from "../../utils/api";

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
    const params = useParams();
    const resetToken = token ?? params.token;
    const { login } = useAuth();

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
            <div className="mx-auto flex max-w-5xl flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:rounded-[2rem] lg:flex-row">
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
