import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Clock3, Flame, UserCircle2 } from "lucide-react";
import { recipeApi } from "../../utils/api";
import { formatDuration } from "../../utils/time";
import type { Recipe, User } from "../../types";

interface UserRecipesResponse {
    numberOfRecipes: number;
    recipes: Recipe[];
    user: User;
}

export const ProfilePage = () => {
    const { id } = useParams();
    const [profile, setProfile] = useState<UserRecipesResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;

        const loadProfile = async () => {
            setLoading(true);
            setError("");

            try {
                const response = await recipeApi.userRecipes(id);
                const data = response.data?.data;

                if (data && !Array.isArray(data)) {
                    setProfile({
                        numberOfRecipes: data.numberOfRecipes ?? data.recipes?.length ?? 0,
                        recipes: data.recipes ?? [],
                        user: data.user,
                    });
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
    }, [id]);

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
                        <div className="rounded-full bg-amber-100 p-3 text-amber-600">
                            <UserCircle2 size={32} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">Profile</p>
                            <h1 className="mt-1 text-3xl font-semibold text-slate-900">{profile.user.username}</h1>
                            <p className="mt-1 text-slate-500">{profile.numberOfRecipes} recipe{profile.numberOfRecipes === 1 ? "" : "s"}</p>
                        </div>
                    </div>
                </section>

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
            </div>
        </div>
    );
};
