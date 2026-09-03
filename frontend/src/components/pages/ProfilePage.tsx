import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Clock3, Dumbbell, Flame, Pencil, Plus, Search, Wheat } from "lucide-react";
import { recipeApi, userApi } from "../../utils/api";
import { formatDuration } from "../../utils/time";
import type { Recipe, User } from "../../types";
import { useAuth } from "../../contexts/AuthContext";
import { RecipePagination } from "../recipes/RecipePagination";
import { UserAvatar } from "../layout/UserAvatar";

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
    const [searchParams, setSearchParams] = useSearchParams();
    const pageFromUrl = Math.max(Number(searchParams.get("page")) || 1, 1);
    const [page, setPage] = useState(pageFromUrl);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [saving, setSaving] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setPage(pageFromUrl);
    }, [pageFromUrl]);

    const changePage = (nextPage: number) => {
        setPage(nextPage);
        setSearchParams(
            (currentParams) => {
                currentParams.set("page", String(nextPage));
                return currentParams;
            },
            { replace: false },
        );
    };

    useEffect(() => {
        if (!id) return;

        const loadProfile = async () => {
            setLoading(true);
            setError("");

            try {
                const response = await recipeApi.userRecipes(id, page, 9, search);
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
        const nextSearch = searchInput.trim();
        if (nextSearch === search) return;

        const timeoutId = window.setTimeout(() => {
            setPage(1);
            setSearch(nextSearch);
            setSearchParams(
                (currentParams) => {
                    currentParams.set("page", "1");
                    return currentParams;
                },
                { replace: true },
            );
        }, 1000);

        return () => window.clearTimeout(timeoutId);
    }, [searchInput, search, setSearchParams]);

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
                <div className="mx-auto max-w-7xl animate-pulse rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm sm:rounded-[2rem] sm:p-10">
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
            <div className="mx-auto max-w-7xl">
                <section className="mb-8 rounded-[1.5rem] border border-amber-100 bg-white p-6 shadow-sm sm:rounded-[2rem] sm:p-10">
                    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                        <span className="rounded-full ring-4 ring-amber-100">
                            <UserAvatar
                                username={profile.user.username}
                                imageUrl={profile.user.profileImage?.imageUrl}
                                sizeClassName="h-16 w-16"
                                iconSize={32}
                            />
                        </span>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">Profile</p>
                            <h1 className="mt-1 text-3xl font-semibold text-slate-900">{profile.user.username}</h1>
                            <p className="mt-1 text-slate-500">{profile.numberOfRecipes} recipe{profile.numberOfRecipes === 1 ? "" : "s"}</p>
                        </div>
                        {canEdit ? (
                            <button
                                type="button"
                                onClick={() => setEditing((value) => !value)}
                                className="sm:ml-auto inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-amber-50"
                            >
                                <Pencil size={15} /> {editing ? "Cancel" : "Edit profile"}
                            </button>
                        ) : null}
                    </div>
                    {editing ? (
                        <form onSubmit={saveProfile} className="mt-6 grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
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
                                className="w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                            />
                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-5 py-3 font-medium text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {saving ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save profile"
                                )}
                            </button>
                        </form>
                    ) : null}
                </section>
                <div className="mb-6 flex w-full flex-col gap-3 sm:flex-row">
                    <form
                        onSubmit={(event) => event.preventDefault()}
                        className="w-full sm:flex-1"
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
                    {canEdit ? (
                        <Link
                            to="/recipes/new"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 sm:w-auto"
                        >
                            <Plus size={18} />
                            Create new recipe
                        </Link>
                    ) : null}
                </div>

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
                                        <span className="flex items-center gap-1"><Clock3 className="text-amber-500" size={14} /> {formatDuration(recipe.totalTime)}</span>
                                        <span className="flex items-center gap-1"><Flame className="text-orange-500" size={14} /> {recipe.calories} kcal</span>
                                        <span className="flex items-center gap-1"><Wheat className="text-yellow-600" size={14} /> {recipe.carbs}g carbs</span>
                                        <span className="flex items-center gap-1"><Dumbbell className="text-violet-500" size={14} /> {recipe.protein}g protein</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
                <RecipePagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={changePage}
                />
            </div>
        </div>
    );
};
