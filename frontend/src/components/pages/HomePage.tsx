import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Clock3, Flame, Heart, Search, Sparkles, Wheat, Dumbbell } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { recipeApi } from "../../utils/api";
import { formatDuration } from "../../utils/time";
import type { Recipe } from "../../types";
import { LikeLoginModal } from "../recipes/LikeLoginModal";
import { RecipePagination } from "../recipes/RecipePagination";

export const HomePage = () => {
    const { isAuthenticated } = useAuth();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [likedRecipeIds, setLikedRecipeIds] = useState<Record<string, boolean>>({});
    const [likingRecipeIds, setLikingRecipeIds] = useState<Record<string, boolean>>({});
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const pageFromUrl = Math.max(Number(searchParams.get("page")) || 1, 1);
    const [page, setPage] = useState(pageFromUrl);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");

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

    const handleLike = async (recipeId?: string) => {
        if (!recipeId || likedRecipeIds[recipeId] || likingRecipeIds[recipeId]) {
            return;
        }

        if (!isAuthenticated) {
            setShowLoginPrompt(true);
            return;
        }

        try {
            setLikingRecipeIds((previous) => ({ ...previous, [recipeId]: true }));
            const response = await recipeApi.like(recipeId);

            setLikedRecipeIds((previous) => ({ ...previous, [recipeId]: true }));
            setRecipes((currentRecipes) =>
                currentRecipes.map((recipe) =>
                    recipe._id === recipeId
                        ? {
                              ...recipe,
                              likes: response.data.data?.likes ?? recipe.likes ?? 0,
                          }
                        : recipe,
                ),
            );
        } catch (error) {
            console.error("Failed to like recipe:", error);
        } finally {
            setLikingRecipeIds((previous) => ({ ...previous, [recipeId]: false }));
        }
    };

    useEffect(() => {
        const loadRecipes = async () => {
            try {
                const response = await recipeApi.list(page, 9, search);
                setRecipes(response.data?.data ?? []);
                setTotalPages(response.data?.pagination?.totalPages ?? 1);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        loadRecipes();
    }, [page, search]);

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

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.16),_transparent_55%)] px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <section className="mb-8 overflow-hidden rounded-[1.5rem] border border-amber-100 bg-white p-5 shadow-sm sm:mb-10 sm:rounded-[2rem] sm:p-8 lg:p-10 xl:p-12">
                    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                        <div>
                            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                                <Sparkles size={16} /> Discover and share recipes
                            </p>
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                                Build a beautiful recipe collection for every meal.
                            </h1>
                            <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
                                Create, share, and explore a world of culinary delights with our recipe app. Whether you're a seasoned chef or just starting out, you'll find inspiration for every meal.
                            </p>
                            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
                                <Link
                                    to={isAuthenticated ? "/recipes/new" : "/register"}
                                    className="rounded-full bg-amber-500 px-5 py-3 font-medium text-white shadow hover:bg-amber-600"
                                >
                                    Get Started
                                </Link>
                                <Link to="/recipes/new" className="rounded-full border border-slate-200 px-5 py-3 font-medium text-slate-700 hover:bg-slate-50">
                                    Create Recipe
                                </Link>
                            </div>
                        </div>
                        <div className="relative z-10 flex h-full min-h-[250px] items-center justify-center">
                            <img
                                src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80"
                                alt="Friendly chef portrait"
                                className="h-[260px] w-full rounded-[1.1rem] border border-amber-200/20 object-cover object-center shadow-2xl shadow-amber-500/10"
                            />
                        </div>
                    </div>
                </section>

                <section>
                    <div className="mb-6 flex items-end justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
                                Latest recipes
                            </p>
                            <h2 className="text-2xl font-semibold text-slate-900">
                                Fresh from the kitchen
                            </h2>
                        </div>
                        <form
                            onSubmit={(event) => event.preventDefault()}
                            className="mb-6 w-full"
                        >
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    value={searchInput}
                                    onChange={(event) => setSearchInput(event.target.value)}
                                    placeholder="Search recipes..."
                                    aria-label="Search recipes"
                                    className="w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                                />
                            </div>
                        </form>
                    </div>

                    {loading ? (
                        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="animate-pulse group relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm"
                                >
                                    <div className="h-48 w-full bg-slate-100" />
                                    <div className="p-5">
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <div className="h-5 w-3/5 rounded bg-slate-100" />
                                            <div className="h-5 w-12 rounded bg-slate-100" />
                                        </div>
                                        <div className="mb-4 h-12 w-full rounded bg-slate-100" />
                                        <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                                            <div className="h-4 w-24 rounded bg-slate-100" />
                                            <div className="h-4 w-20 rounded bg-slate-100" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : recipes.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
                            No recipes yet. Create the first one.
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {recipes.map((recipe) => (
                                <div
                                    key={recipe._id}
                                    className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                                >
                                    <Link to={`/recipes/${recipe._id}`}>
                                        <img
                                            src={recipe.recipeImage?.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"}
                                            alt={recipe.title}
                                            className="h-48 w-full object-cover"
                                        />
                                        <div className="p-5">
                                            <div className="mb-3 flex items-center justify-between gap-3">
                                                <h3 className="text-lg font-semibold text-slate-900">
                                                    {recipe.title}
                                                </h3>
                                            </div>
                                            <p className="mb-4 line-clamp-3 text-sm text-slate-600">
                                                {recipe.description}
                                            </p>
                                            <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock3 className="text-amber-500" size={14} /> {formatDuration(recipe.totalTime)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Flame className="text-orange-500" size={14} /> {recipe.calories} kcal
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Wheat className="text-yellow-600" size={14} /> {recipe.carbs}g carbs
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Dumbbell className="text-violet-500" size={14} /> {recipe.protein}g protein
                                                </span>
                                            </div>
                                        </div>
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={() => handleLike(recipe._id)}
                                        disabled={!recipe._id || likingRecipeIds[recipe._id] || likedRecipeIds[recipe._id]}
                                        className="absolute right-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-sm font-medium shadow-sm backdrop-blur-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                                        aria-label={`Like ${recipe.title}`}
                                        aria-pressed={likedRecipeIds[recipe._id ?? ""] ?? false}
                                    >
                                        <Heart
                                            size={16}
                                            className={likedRecipeIds[recipe._id ?? ""] ? "fill-rose-500 text-rose-500" : "text-rose-400"}
                                        />
                                        <span className="text-slate-700">
                                            {likingRecipeIds[recipe._id ?? ""] ? "…" : recipe.likes ?? 0}
                                        </span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <RecipePagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={changePage}
                    />
                </section>
            </div>
            <LikeLoginModal
                isOpen={showLoginPrompt}
                onClose={() => setShowLoginPrompt(false)}
            />
        </div>
    );
};
