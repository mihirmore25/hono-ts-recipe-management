import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
    ChefHat,
    Hamburger,
    LogOut,
    UserCircle2,
    UtensilsCrossed,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { FloatingFoodIcons } from "./FloatingFoodIcons";
import { UserAvatar } from "./UserAvatar";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3 py-2.5 text-xs font-medium transition sm:px-4 sm:text-sm ${isActive ? "bg-amber-500 text-white shadow" : "text-slate-700 hover:bg-slate-100"}`;

export const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        logout();
        setMobileMenuOpen(false);
        navigate("/login");
    };

    const closeMenu = () => setMobileMenuOpen(false);

    return (
        <header className="relative overflow-hidden border-b border-slate-200 bg-white/80 backdrop-blur">
            <FloatingFoodIcons />

            <div className="relative z-10 mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-3">
                    <NavLink to="/" className="flex items-center gap-3 min-w-0">
                        <div className="rounded-2xl bg-amber-500 p-2 text-white shadow">
                            <ChefHat size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-slate-900 sm:text-lg">
                                RecipeHub
                            </p>
                            <p className="text-xs text-slate-500">
                                Manage every recipe
                            </p>
                        </div>
                    </NavLink>

                    <div className="hidden items-center gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
                        <NavLink to="/" className={navLinkClass}>
                            Home
                        </NavLink>
                        {isAuthenticated ? (
                            <>
                                <NavLink
                                    to="/recipes/new"
                                    className={navLinkClass}
                                >
                                    New Recipe
                                </NavLink>
                                {user?.role === "admin" ? (
                                    <NavLink
                                        to="/admin/users"
                                        className={navLinkClass}
                                    >
                                        Admin
                                    </NavLink>
                                ) : null}
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 sm:px-4 sm:text-sm"
                                >
                                    <LogOut size={16} /> Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <NavLink to="/login" className={navLinkClass}>
                                    Login
                                </NavLink>
                                <NavLink
                                    to="/register"
                                    className={navLinkClass}
                                >
                                    Register
                                </NavLink>
                            </>
                        )}
                        {user ? (
                            <NavLink
                                to={`/profile/${user._id ?? user.id ?? ""}`}
                                className="ml-1 flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs text-slate-600 transition hover:bg-amber-100 hover:text-amber-700 sm:text-sm"
                            >
                                <UserAvatar username={user.username} imageUrl={user.profileImage?.imageUrl} sizeClassName="h-5 w-5" iconSize={16} />{" "}
                                {user.username}
                            </NavLink>
                        ) : null}
                    </div>

                    <div className="flex items-center gap-2 sm:hidden">
                        {user ? (
                            <NavLink
                                to={`/profile/${user._id ?? user.id ?? ""}`}
                                className="flex max-w-[9rem] items-center gap-2 truncate rounded-full bg-slate-100 px-3 py-2 text-xs text-slate-600"
                            >
                                <UserAvatar username={user.username} imageUrl={user.profileImage?.imageUrl} sizeClassName="h-5 w-5" iconSize={16} />{" "}
                                <span className="truncate">{user.username}</span>
                            </NavLink>
                        ) : null}
                        <button
                            type="button"
                            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                            onClick={() => setMobileMenuOpen((open) => !open)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-amber-50 hover:text-amber-700"
                        >
                            {mobileMenuOpen ? (
                                <UtensilsCrossed
                                    size={18}
                                    strokeWidth={2.5}
                                    className="text-amber-500"
                                />
                            ) : (
                                <Hamburger
                                    size={20}
                                    strokeWidth={2.2}
                                    className="text-amber-500"
                                />
                            )}
                        </button>
                    </div>
                </div>

                {mobileMenuOpen ? (
                    <nav className="mt-3 flex flex-col gap-2 rounded-[1.25rem] border border-slate-200 bg-white p-3 shadow-sm sm:hidden">
                        <NavLink
                            to="/"
                            className={navLinkClass}
                            onClick={closeMenu}
                        >
                            Home
                        </NavLink>
                        {isAuthenticated ? (
                            <>
                                <NavLink
                                    to="/recipes/new"
                                    className={navLinkClass}
                                    onClick={closeMenu}
                                >
                                    New Recipe
                                </NavLink>
                                {user?.role === "admin" ? (
                                    <NavLink
                                        to="/admin/users"
                                        className={navLinkClass}
                                        onClick={closeMenu}
                                    >
                                        Admin
                                    </NavLink>
                                ) : null}
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center justify-center gap-2 rounded-full border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                                >
                                    <LogOut size={16} /> Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <NavLink
                                    to="/login"
                                    className={navLinkClass}
                                    onClick={closeMenu}
                                >
                                    Login
                                </NavLink>
                                <NavLink
                                    to="/register"
                                    className={navLinkClass}
                                    onClick={closeMenu}
                                >
                                    Register
                                </NavLink>
                            </>
                        )}
                        {user ? (
                            <NavLink
                                to={`/profile/${user._id ?? user.id ?? ""}`}
                                onClick={closeMenu}
                                className="mt-1 flex items-center justify-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs text-slate-600 transition hover:bg-amber-100 hover:text-amber-700"
                            >
                                <UserCircle2 size={16} /> {user.username}
                            </NavLink>
                        ) : null}
                    </nav>
                ) : null}
            </div>
        </header>
    );
};
