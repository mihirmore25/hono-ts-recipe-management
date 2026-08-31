import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Clock3, Flame, Pencil, Search, UserCircle2 } from "lucide-react";
import { recipeApi, userApi } from "../../utils/api";
import { formatDuration } from "../../utils/time";
import type { Recipe, User } from "../../types";
import { useAuth } from "../../contexts/AuthContext";
import { RecipePagination } from "../recipes/RecipePagination";

interface UserRecipesResponse {
    numberOfRecipes: number;
    recipes: Recipe[];
    user: User;
}

export const ProfilePage = () => {
    const { id } = useParams();
    const { user: currentUser, login } = useAuth();
    const [profile, setProfile] = useState<UserRecipesResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editing, setEditing] = useState(false);
    const [username, setUsername] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [saving, setSaving] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!id) return;

        const loadProfile = async () => {
            setLoading(true);
            setError("");

            try {
                const response = await recipeApi.userRecipes(id, page, 8, search);
                const data = response.data?.data;

                if (data && !Array.isArray(data)) {
                    setProfile({
                        numberOfRecipes: data.numberOfRecipes ?? data.recipes?.length ?? 0,
                        recipes: data.recipes ?? [],
                        user: data.user,
                    });
                    setTotalPages(data.pagination?.totalPages ?? 1);
                    setUsername(data.user?.username ?? "");
                } else {
                    setProfile(null);
                }
            } catch (requestError) {
                console.error("Failed to load user recipes:", requestError);
                setError("Unable to load this profile.");
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [id, page, search]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setPage(1);
            setSearch(searchInput.trim());
        }, 1000);

        return () => window.clearTimeout(timeoutId);
    }, [searchInput]);

    const canEdit =
        Boolean(id) &&
        (currentUser?._id === id ||
            currentUser?.id === id ||
            currentUser?.role === "admin");

    const saveProfile = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!id || !canEdit || !username.trim()) return;

        setSaving(true);
        setError("");
        try {
            const formData = new FormData();
            formData.append("username", username.trim());
            if (image) formData.append("image", image);

            const response = await userApi.updateProfile(id, formData);
            const updatedUser = response.data?.data;
            setProfile((current) =>
                current ? { ...current, user: updatedUser } : current,
            );
            if (
                currentUser &&
                (currentUser._id === id || currentUser.id === id)
            ) {
                login(updatedUser, localStorage.getItem("token") ?? "");
            }
            setImage(null);
            setEditing(false);
        } catch (requestError) {
            console.error("Failed to update profile:", requestError);
            setError("Unable to update this profile.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 px-3 py-8 sm:px-6 sm:py-12 lg:px-8">
                <div className="mx-auto max-w-6xl animate-pulse rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm sm:rounded-[2rem] sm:p-10">
                    <div className="h-8 w-56 rounded bg-slate-100" />
                    <div className="mt-3 h-4 w-32 rounded bg-slate-100" />
                    <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="overflow-hidden rounded-2xl border border-slate-200">
                                <div className="h-48 bg-slate-100" />
                                <div className="space-y-3 p-5">
                                    <div className="h-5 w-3/5 rounded bg-slate-100" />
                                    <div className="h-12 rounded bg-slate-100" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return <div className="px-4 py-12 text-center text-slate-500">{error || "Profile not found."}</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
            <div className="mx-auto max-w-6xl">
                <section className="mb-8 rounded-[1.5rem] border border-amber-100 bg-white p-6 shadow-sm sm:rounded-[2rem] sm:p-10">
                    <div className="flex items-center gap-4">
                        {profile.user.profileImage?.imageUrl ? (
                            <img
                                src={profile.user.profileImage.imageUrl}
                                alt={profile.user.username}
                                className="h-16 w-16 rounded-full object-cover ring-4 ring-amber-100"
                            />
                        ) : (
                            <div className="rounded-full bg-amber-100 p-3 text-amber-600">
                                <UserCircle2 size={32} />
                            </div>
                        )}
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">Profile</p>
                            <h1 className="mt-1 text-3xl font-semibold text-slate-900">{profile.user.username}</h1>
                            <p className="mt-1 text-slate-500">{profile.numberOfRecipes} recipe{profile.numberOfRecipes === 1 ? "" : "s"}</p>
                        </div>
                        {canEdit ? (
                            <button
                                type="button"
                                onClick={() => setEditing((value) => !value)}
                                className="ml-auto inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-amber-50"
                            >
                                <Pencil size={15} /> {editing ? "Cancel" : "Edit profile"}
                            </button>
                        ) : null}
                    </div>
                    {editing ? (
                        <form onSubmit={saveProfile} className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                            <input
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                className="rounded-2xl border border-slate-200 px-4 py-3"
                                placeholder="Username"
                                required
                            />
                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(event) => setImage(event.target.files?.[0] ?? null)}
                                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                            />
                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-full bg-amber-500 px-5 py-3 font-medium text-white hover:bg-amber-600 disabled:opacity-60"
                            >
                                {saving ? "Saving..." : "Save"}
                            </button>
                        </form>
                    ) : null}
                </section>
                <form
                    onSubmit={(event) => event.preventDefault()}
                    className="mb-6 w-full"
                >
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="Search this user's recipes..."
                            aria-label="Search this user's recipes"
                            className="w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                        />
                    </div>
                </form>

                {profile.recipes.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
                        This user has not created any recipes yet.
                    </div>
                ) : (
                    <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {profile.recipes.map((recipe) => (
                            <Link
                                key={recipe._id}
                                to={`/recipes/${recipe._id}`}
                                className="group overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                            >
                                <img
                                    src={recipe.recipeImage?.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"}
                                    alt={recipe.title}
                                    className="h-48 w-full object-cover"
                                />
                                <div className="p-5">
                                    <h2 className="text-lg font-semibold text-slate-900">{recipe.title}</h2>
                                    <p className="mb-4 mt-2 line-clamp-3 text-sm text-slate-600">{recipe.description}</p>
                                    <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                                        <span className="flex items-center gap-1"><Clock3 size={14} /> {formatDuration(recipe.totalTime)}</span>
                                        <span className="flex items-center gap-1"><Flame size={14} /> {recipe.calories} kcal</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
                <RecipePagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />
            </div>
        </div>
    );
};
