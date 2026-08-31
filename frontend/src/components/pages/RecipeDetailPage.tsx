import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    Clock3,
    Flame,
    Heart,
    Wheat,
    Dumbbell,
    PencilLine,
    Trash2,
    UserCircle2,
    X,
} from "lucide-react";
import { recipeApi } from "../../utils/api";
import { formatDuration } from "../../utils/time";
import type { Recipe } from "../../types";
import { useAuth } from "../../contexts/AuthContext";

const displayRecipeList = (
    value: string[] | string | undefined,
    type: "ingredient" | "instruction",
) => {
    const values = Array.isArray(value) ? value : [String(value ?? "")];
    const items = values
        .flatMap((item) => item.split(/\r?\n/))
        .flatMap((item) =>
            type === "instruction" ? item.split(/(?=\b\d+\.\s+)/) : [item],
        )
        .map((item) => item.replace(/^\d+\.\s*/, "").trim())
        .filter(Boolean);

    if (type === "instruction") return items;

    const repaired: string[] = [];
    for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        const next = items[index + 1];
        const previous = repaired[repaired.length - 1];

        if (/^\d+\/$/.test(item) && next) {
            repaired.push(`${item}${next}`);
            index += 1;
            continue;
        }

        if (previous && previous.endsWith("(")) {
            repaired[repaired.length - 1] = `${previous}${item}`;
            continue;
        }

        repaired.push(item);
    }

    return repaired;
};
import { RecipePageNavigation } from "../recipes/RecipePageNavigation";
import { LikeLoginModal } from "../recipes/LikeLoginModal";
import { FloatingFoodIcons } from "../layout/FloatingFoodIcons";

export const RecipeDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false);
    const [liking, setLiking] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [showImagePreview, setShowImagePreview] = useState(false);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        if (!id) return;
        const loadRecipe = async () => {
            try {
                const response = await recipeApi.get(id);
                const data = response.data?.data;
                if (!data) {
                    throw new Error(
                        response.data?.message || "Recipe not found.",
                    );
                }
                setRecipe(data);
            } catch (error) {
                console.error("Failed to load recipe:", error);
                setLoadError("Unable to load this recipe.");
            } finally {
                setLoading(false);
            }
        };
        loadRecipe();
    }, [id]);

    const handleDelete = async () => {
        if (!id) return;
        setDeleting(true);
        setDeleteError("");

        try {
            await recipeApi.remove(id);
            navigate("/");
        } catch {
            setDeleteError("Unable to delete this recipe. Please try again.");
        } finally {
            setDeleting(false);
        }
    };

    const handleLike = async () => {
        if (!id || liked || liking) return;

        if (!isAuthenticated) {
            setShowLoginPrompt(true);
            return;
        }

        try {
            setLiking(true);
            const response = await recipeApi.like(id);
            setLiked(true);
            setRecipe((currentRecipe) =>
                currentRecipe
                    ? {
                          ...currentRecipe,
                          likes:
                              response.data.data?.likes ??
                              currentRecipe.likes ??
                              0,
                      }
                    : currentRecipe,
            );
        } catch (error) {
            console.error("Failed to like recipe:", error);
        } finally {
            setLiking(false);
        }
    };

    if (loading)
        return (
            <div className="min-h-screen bg-slate-50 px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
                <div className="mx-auto mb-4 max-w-6xl">
                    <div className="h-6 w-48 animate-pulse rounded bg-slate-100" />
                </div>
                <div className="mx-auto max-w-6xl overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:rounded-[2rem]">
                    <div className="h-72 w-full bg-slate-100 animate-pulse" />
                    <div className="p-5 sm:p-8 lg:p-10">
                        <div className="mb-3 h-6 w-3/5 animate-pulse rounded bg-slate-100" />
                        <div className="mt-4 mb-6 h-4 w-full animate-pulse rounded bg-slate-100" />

                        <div className="mt-8 grid gap-3 rounded-[1.25rem] bg-slate-50 p-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:p-5">
                            <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                            <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                            <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                            <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                        </div>

                        <div className="mt-8 grid gap-6 sm:mt-10 lg:grid-cols-2">
                            <div>
                                <div className="h-6 w-40 animate-pulse rounded bg-slate-100" />
                                <div className="mt-4 space-y-3">
                                    <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
                                    <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
                                </div>
                            </div>
                            <div>
                                <div className="h-6 w-40 animate-pulse rounded bg-slate-100" />
                                <div className="mt-4 space-y-3">
                                    <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
                                    <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    if (!recipe)
        return (
            <div className="px-4 py-12 text-center text-slate-500">
                {loadError || "Recipe not found."}
            </div>
        );

    const canManage = user?._id === recipe.user || user?.role === "admin";

    return (
        <div className="min-h-screen bg-slate-50 px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
            <div className="mx-auto mb-4 max-w-6xl">
                <RecipePageNavigation />
            </div>
            <div className="mx-auto max-w-6xl relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:rounded-[2rem]">
                <FloatingFoodIcons
                    className="z-10"
                    mobileCount={10}
                    desktopOpacity={0.22}
                    mobileOpacity={0.18}
                    desktopSizeOffset={6}
                    mobileSizeOffset={1}
                    desktopFilter="drop-shadow(0 6px 10px rgba(15, 23, 42, 0.08))"
                    mobileFilter="drop-shadow(0 6px 8px rgba(15, 23, 42, 0.06))"
                />
                <div className="relative z-20">
                    <button
                        type="button"
                        onClick={() => setShowImagePreview(true)}
                        className="block w-full cursor-zoom-in"
                        aria-label={`View full image of ${recipe.title}`}
                    >
                        <img
                            src={
                                recipe.recipeImage?.imageUrl ||
                                "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"
                            }
                            alt={recipe.title}
                            className="h-72 w-full object-cover"
                        />
                    </button>
                    <div className="p-5 sm:p-8 lg:p-10">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
                                    Featured recipe
                                </p>
                                <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
                                    {recipe.title}
                                </h1>
                                {recipe.user &&
                                typeof recipe.user === "object" &&
                                recipe.user._id ? (
                                    <Link
                                        to={`/profile/${recipe.user._id}`}
                                        className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs text-slate-600 transition hover:bg-amber-100 hover:text-amber-700 sm:text-sm"
                                    >
                                        {recipe.user.profileImage?.imageUrl ? (
                                            <img
                                                src={recipe.user.profileImage.imageUrl}
                                                alt=""
                                                className="h-5 w-5 rounded-full object-cover"
                                            />
                                        ) : (
                                            <UserCircle2 size={16} />
                                        )}
                                        Created by {recipe.user.username}
                                    </Link>
                                ) : null}
                            </div>
                            {canManage ? (
                                <div className="flex flex-wrap gap-2">
                                    <Link
                                        to={`/recipes/${recipe._id}/edit`}
                                        className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                    >
                                        <PencilLine size={16} /> Edit
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowDeleteConfirm(true)
                                        }
                                        className="flex items-center gap-2 rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
                                    >
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                            ) : null}
                        </div>

                        <p className="mt-5 max-w-3xl text-base text-slate-600 sm:text-lg">
                            {recipe.description}
                        </p>

                        <div className="mt-8 grid gap-3 rounded-[1.25rem] bg-slate-50 p-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:p-5">
                            <div className="flex items-center gap-2 text-slate-700">
                                <Clock3 size={16} />{" "}
                                {formatDuration(recipe.totalTime)} total
                            </div>
                            <div className="flex items-center gap-2 text-slate-700">
                                <Clock3 size={16} />{" "}
                                {formatDuration(recipe.prepTime)} prep
                            </div>
                            <div className="flex items-center gap-2 text-slate-700">
                                <Flame size={16} /> {recipe.calories} kcal
                            </div>
                            <div className="flex items-center gap-2 text-slate-700">
                                <Wheat size={16} /> {recipe.carbs}g carbs
                            </div>
                            <div className="flex items-center gap-2 text-slate-700">
                                <Dumbbell size={16} /> {recipe.protein}g protein
                            </div>
                            <button
                                type="button"
                                onClick={handleLike}
                                disabled={liked || liking}
                                className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                                aria-pressed={liked}
                            >
                                <Heart
                                    size={16}
                                    className={
                                        liked ? "fill-red-500 text-red-500" : ""
                                    }
                                />
                                {liking
                                    ? "Updating…"
                                    : `${recipe.likes ?? 0} likes`}
                            </button>
                        </div>

                        <div className="mt-8 grid gap-6 sm:mt-10 lg:grid-cols-2">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">
                                    Ingredients
                                </h2>
                                <ul className="mt-4 flex flex-wrap gap-3 text-slate-600">
                                    {displayRecipeList(
                                        recipe.ingredients,
                                        "ingredient",
                                    )
                                        .map((item, i) => (
                                            <li
                                                key={i}
                                                className="w-fit max-w-full rounded-2xl bg-slate-50 px-4 py-3 break-words"
                                            >
                                                {item}
                                            </li>
                                        ))}
                                </ul>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">
                                    Instructions
                                </h2>
                                <ol className="mt-4 space-y-3 text-slate-600">
                                    {displayRecipeList(
                                        recipe.instructions,
                                        "instruction",
                                    )
                                        .map((item, i) => (
                                            <li
                                                key={i}
                                                className="rounded-2xl bg-slate-50 px-4 py-3"
                                            >
                                                {i + 1}. {item}
                                            </li>
                                        ))}
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showDeleteConfirm ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4"
                    onClick={() => !deleting && setShowDeleteConfirm(false)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-recipe-title"
                        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl sm:p-8"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <h2
                            id="delete-recipe-title"
                            className="text-xl font-semibold text-slate-900"
                        >
                            Delete this recipe?
                        </h2>
                        <p className="mt-3 text-slate-600">
                            Are you sure you want to delete “{recipe.title}”?
                            This action cannot be undone.
                        </p>

                        {deleteError ? (
                            <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                {deleteError}
                            </p>
                        ) : null}

                        <div className="mt-6 flex flex-wrap justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleting}
                                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {deleting ? "Deleting…" : "Yes, delete recipe"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
            <LikeLoginModal
                isOpen={showLoginPrompt}
                onClose={() => setShowLoginPrompt(false)}
            />
            {showImagePreview ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 sm:p-8"
                    onClick={() => setShowImagePreview(false)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label={`Full image of ${recipe.title}`}
                        className="relative flex max-h-full max-w-6xl items-center justify-center"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <img
                            src={
                                recipe.recipeImage?.imageUrl ||
                                "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=90"
                            }
                            alt={recipe.title}
                            className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
                        />
                        <button
                            type="button"
                            onClick={() => setShowImagePreview(false)}
                            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow transition hover:bg-white"
                            aria-label="Close full image"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
};
