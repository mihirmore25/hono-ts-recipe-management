import { useEffect, useRef, useState } from "react";
import {
    ChefHat,
    Coffee,
    Croissant,
    Pizza,
    Salad,
    Soup,
    Sparkles,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { recipeApi } from "../../utils/api";
import { formatDuration } from "../../utils/time";
import type { Recipe } from "../../types";
import { RecipePageNavigation } from "./RecipePageNavigation";
import { useAuth } from "../../contexts/AuthContext";

const emptyRecipe = {
    title: "",
    description: "",
    totalTime: 20,
    prepTime: 10,
    cookingTime: 10,
    ingredients: "",
    instructions: "",
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
};

const toFormList = (value: string[] | string | undefined) => {
    const items = (Array.isArray(value) ? value : (value?.split("\n") ?? []))
        .flatMap((item) =>
            typeof item === "string" ? item.split(/\r?\n|;/) : [],
        )
        .map((item) => item.trim())
        .filter(Boolean);

    const repaired: string[] = [];
    for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        const next = items[index + 1];

        if (/^\d+\/$/.test(item) && next) {
            repaired.push(`${item}${next}`);
            index += 1;
            continue;
        }

        const previous = repaired[repaired.length - 1];
        if (previous?.endsWith("(")) {
            repaired[repaired.length - 1] = `${previous}${item}`;
            continue;
        }

        repaired.push(item);
    }

    return repaired;
};

const normalizeGeneratedList = (
    value: unknown,
    type: "ingredient" | "instruction",
) => {
    if (!Array.isArray(value)) return [];

    const items = value.flatMap((item) => {
        if (typeof item !== "string") return [];
        const pattern = /(?=\b\d+\.\s*)/;

        return item
            .replace(/\s+/g, " ")
            .trim()
            .split(type === "instruction" ? pattern : /\r?\n|;/)
            .map((part) => part.replace(/^\d+\.\s*/, "").trim())
            .filter(Boolean);
    });

    return type === "ingredient" ? toFormList(items) : items;
};

type NumericRecipeField =
    | "totalTime"
    | "prepTime"
    | "cookingTime"
    | "calories"
    | "carbs"
    | "protein"
    | "fat";

const numberInputValue = (value: string) => {
    if (value === "") return "" as unknown as number;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

export const RecipeForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [recipe, setRecipe] = useState<Recipe>(emptyRecipe as Recipe);
    const [file, setFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [ingredients, setIngredients] = useState<string[]>([]);
    const [ingredientInput, setIngredientInput] = useState("");
    const [instructions, setInstructions] = useState<string[]>([]);
    const [instructionInput, setInstructionInput] = useState("");
    const [clearedInitialNumbers, setClearedInitialNumbers] = useState<
        Set<NumericRecipeField>
    >(() => new Set());
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [aiIdea, setAiIdea] = useState("");
    const [generating, setGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);

    const FoodConfetti = ({ onFinish }: { onFinish?: () => void }) => {
        const icons = [ChefHat, Pizza, Croissant, Coffee, Salad, Soup];
        const colors = [
            "#FB923C",
            "#FB7185",
            "#F59E0B",
            "#34D399",
            "#60A5FA",
            "#A78BFA",
            "#F472B6",
        ];
        const count = 22;
        const distance = 220; // px

        const pieces = Array.from({ length: count }).map((_, i) => {
            const Icon = icons[Math.floor(Math.random() * icons.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const left = Math.floor(Math.random() * 80) + 10; // percent across button width
            const delay = (Math.random() * 0.35).toFixed(2) + "s";
            const duration = (0.9 + Math.random() * 0.9).toFixed(2) + "s";
            const size = Math.floor(Math.random() * 12) + 12;
            const rotate = Math.floor(Math.random() * 360);
            // Spread across 140 degrees centered upward (90deg)
            const angleDeg = 90 + (Math.random() * 140 - 70);
            const angleRad = (angleDeg * Math.PI) / 180;
            const dx = Math.cos(angleRad) * distance;
            const dy = -Math.sin(angleRad) * distance; // negative moves up
            return {
                id: i,
                Icon,
                left,
                delay,
                duration,
                size,
                rotate,
                color,
                dx,
                dy,
            };
        });

        useEffect(() => {
            const total = 1400;
            const t = setTimeout(() => onFinish && onFinish(), total);
            return () => clearTimeout(t);
        }, [onFinish]);

        return (
            <div className="pointer-events-none absolute left-0 top-0 -translate-y-6 flex h-0 w-full overflow-visible">
                <style>{`
                    @keyframes foodConfetti {
                        0% { transform: translate3d(0,0,0) scale(1) rotate(0deg); opacity: 1 }
                        100% { transform: translate3d(var(--dx), var(--dy), 0) scale(0.85) rotate(360deg); opacity: 0 }
                    }
                `}</style>
                {pieces.map(
                    ({
                        id,
                        Icon,
                        left,
                        delay,
                        duration,
                        size,
                        rotate,
                        color,
                        dx,
                        dy,
                    }) => (
                        <div
                            key={id}
                            className="absolute"
                            style={
                                {
                                    left: `${left}%`,
                                    transform: `translateX(-50%) rotate(${rotate}deg)`,
                                    animation: `foodConfetti ${duration} linear ${delay} forwards`,
                                    opacity: 0,
                                    // css vars for endpoint
                                    ["--dx" as any]: `${dx.toFixed(2)}px`,
                                    ["--dy" as any]: `${dy.toFixed(2)}px`,
                                    color,
                                } as React.CSSProperties
                            }
                        >
                            <Icon size={size} strokeWidth={1.6} />
                        </div>
                    ),
                )}
            </div>
        );
    };

    useEffect(() => {
        if (!file) {
            setImagePreview(null);
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);

        return () => URL.revokeObjectURL(previewUrl);
    }, [file]);

    const removeSelectedImage = () => {
        setFile(null);
        if (imageInputRef.current) imageInputRef.current.value = "";
    };

    useEffect(() => {
        if (!id) return;
        const loadRecipe = async () => {
            const response = await recipeApi.get(id);
            const data = response.data?.data;
            setRecipe({
                ...data,
                ingredients: data?.ingredients ?? "",
                instructions: data?.instructions ?? "",
            });
            setIngredients(toFormList(data?.ingredients));
            setInstructions(toFormList(data?.instructions));
        };
        loadRecipe().catch(() => setError("Unable to load recipe"));
    }, [id]);

    const addIngredient = () => {
        const ingredient = ingredientInput.trim();
        if (!ingredient) return;

        setIngredients((items) => [...items, ingredient]);
        setIngredientInput("");
    };

    const addInstruction = () => {
        const instruction = instructionInput.trim();
        if (!instruction) return;

        setInstructions((items) => [...items, instruction]);
        setInstructionInput("");
    };

    const generateWithAi = async () => {
        if (aiIdea.trim().length < 3) {
            setError("Describe the recipe you want AI to create.");
            return;
        }

        setGenerating(true);
        setError("");
        setGenerationProgress(8);
        const progressTimer = window.setInterval(() => {
            setGenerationProgress((current) =>
                current >= 92 ? current : Math.min(current + 7, 92),
            );
        }, 450);

        try {
            const response = await recipeApi.generate(aiIdea.trim());
            const generated = response.data?.data;
            if (!response.data?.status || !generated) {
                throw new Error(response.data?.message || "Unable to generate recipe.");
            }

            setRecipe((current) => ({
                ...current,
                ...generated,
            }));
            setIngredients(
                normalizeGeneratedList(generated.ingredients, "ingredient"),
            );
            setInstructions(
                normalizeGeneratedList(generated.instructions, "instruction"),
            );
            setGenerationProgress(100);
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    err?.message ||
                    "Unable to generate recipe with AI.",
            );
        } finally {
            window.clearInterval(progressTimer);
            setGenerating(false);
        }
    };

    const clearInitialNumber = (
        field: NumericRecipeField,
        initialValue: number,
    ) => {
        if (
            !id &&
            recipe[field] === initialValue &&
            !clearedInitialNumbers.has(field)
        ) {
            setRecipe((current) => ({
                ...current,
                [field]: "" as unknown as number,
            }));
            setClearedInitialNumbers((fields) => new Set(fields).add(field));
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (saving) return;
        if (!isAuthenticated || !localStorage.getItem("token")) {
            setError("Please log in again before creating a recipe.");
            navigate("/login");
            return;
        }

        const ingredientList = ingredients
            .map((item) => item.trim())
            .filter(Boolean);
        const instructionList = instructions
            .map((item) => item.trim())
            .filter(Boolean);

        if (!ingredientList.length || !instructionList.length) {
            setError("Add at least one ingredient and one instruction.");
            return;
        }

        const numericFields: NumericRecipeField[] = [
            "totalTime",
            "prepTime",
            "cookingTime",
            "calories",
            "carbs",
            "protein",
            "fat",
        ];
        const hasInvalidNumber = numericFields.some((field) => {
            const value = recipe[field];
            return (
                typeof value !== "number" ||
                !Number.isInteger(value) ||
                value < 0
            );
        });

        if (hasInvalidNumber) {
            setError("Numeric values must be whole numbers greater than or equal to 0.");
            return;
        }

        const formData = new FormData();
        Object.entries(recipe).forEach(([key, value]) => {
            if (
                key !== "ingredients" &&
                key !== "instructions" &&
                value !== undefined
            ) {
                formData.append(key, String(value));
            }
        });
        formData.append("ingredients", ingredientList.join("\n"));
        formData.append("instructions", instructionList.join("\n"));
        if (file) formData.append("image", file);

        try {
            setSaving(true);
            if (id) {
                await recipeApi.update(id, formData);
            } else {
                const response = await recipeApi.create(formData);
                if (!response.data?.status || !response.data?.data?.[0]) {
                    throw new Error(
                        response.data?.message || "Recipe was not created.",
                    );
                }
            }
            // show confetti then navigate
            setShowConfetti(true);
            setTimeout(() => navigate("/"), 900);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Unable to save recipe");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
            <div className="mx-auto max-w-7xl rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[2rem] sm:p-8 lg:p-10">
                <div className="mb-6">
                    <RecipePageNavigation />
                </div>
                <div className="mb-6 sm:mb-8">
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
                        Recipe details
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
                        {id ? "Edit recipe" : "Create a new recipe"}
                    </h1>
                </div>

                {!id ? (
                    <div className="mb-6 rounded-2xl border border-violet-200 bg-violet-50 p-4 sm:p-5">
                        <p className="text-sm font-semibold text-violet-900">
                            Generate a recipe with Gemini AI
                        </p>
                        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                            <input
                                value={aiIdea}
                                onChange={(event) => setAiIdea(event.target.value)}
                                placeholder="e.g. high-protein vegetarian pasta"
                                maxLength={500}
                                className="min-w-0 flex-1 rounded-2xl border border-violet-200 bg-white px-4 py-3 focus:border-violet-500 focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={generateWithAi}
                                disabled={generating}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Sparkles size={16} aria-hidden="true" />
                                {generating ? "Generating..." : "Generate with AI"}
                            </button>
                        </div>
                        {generating ? (
                            <div
                                className="mt-3"
                                role="status"
                                aria-live="polite"
                            >
                                <div className="mb-1 flex items-center justify-between text-xs font-medium text-violet-700">
                                    <span>
                                        {generationProgress < 35
                                            ? "Understanding your idea..."
                                            : generationProgress < 70
                                              ? "Creating ingredients and instructions..."
                                              : "Finishing nutrition details..."}
                                    </span>
                                    <span>{generationProgress}%</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-violet-100">
                                    <div
                                        className="h-full rounded-full bg-violet-600 transition-[width] duration-300"
                                        style={{ width: `${generationProgress}%` }}
                                    />
                                </div>
                            </div>
                        ) : null}
                        <p className="mt-2 text-xs text-violet-700">
                            Review and edit the generated fields before saving.
                        </p>
                    </div>
                ) : null}

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5 sm:space-y-6"
                >
                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Title
                            </label>
                            <input
                                value={recipe.title}
                                onChange={(e) =>
                                    setRecipe({
                                        ...recipe,
                                        title: e.target.value,
                                    })
                                }
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-amber-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Image
                            </label>
                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    setFile(e.target.files?.[0] ?? null)
                                }
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                            />
                            {imagePreview ? (
                                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                    <img
                                        src={imagePreview}
                                        alt="Selected recipe preview"
                                        className="h-48 w-full rounded-xl object-cover"
                                    />
                                    <div className="mt-3 flex items-center justify-between gap-3">
                                        <p className="truncate text-sm text-slate-600">
                                            {file?.name}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={removeSelectedImage}
                                            className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                                        >
                                            Remove image
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Description
                        </label>
                        <textarea
                            value={recipe.description}
                            onChange={(e) =>
                                setRecipe({
                                    ...recipe,
                                    description: e.target.value,
                                })
                            }
                            className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-amber-500"
                            required
                        />
                    </div>

                    <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Total Time (minutes)
                            </label>
                            <input
                                type="number"
                                min={0}
                                step={1}
                                value={recipe.totalTime}
                                onFocus={() =>
                                    clearInitialNumber("totalTime", 20)
                                }
                                onChange={(e) =>
                                    setRecipe({
                                        ...recipe,
                                        totalTime: numberInputValue(
                                            e.target.value,
                                        ),
                                    })
                                }
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                                required
                            />
                            {Number(recipe.totalTime) >= 60 ? (
                                <p className="mt-2 text-sm text-amber-700">
                                    {formatDuration(recipe.totalTime)}
                                </p>
                            ) : null}
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Prep Time (minutes)
                            </label>
                            <input
                                type="number"
                                min={0}
                                step={1}
                                value={recipe.prepTime}
                                onFocus={() =>
                                    clearInitialNumber("prepTime", 10)
                                }
                                onChange={(e) =>
                                    setRecipe({
                                        ...recipe,
                                        prepTime: numberInputValue(
                                            e.target.value,
                                        ),
                                    })
                                }
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                                required
                            />
                            {Number(recipe.prepTime) >= 60 ? (
                                <p className="mt-2 text-sm text-amber-700">
                                    {formatDuration(recipe.prepTime)}
                                </p>
                            ) : null}
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Cooking Time (minutes)
                            </label>
                            <input
                                type="number"
                                min={0}
                                step={1}
                                value={recipe.cookingTime}
                                onFocus={() =>
                                    clearInitialNumber("cookingTime", 10)
                                }
                                onChange={(e) =>
                                    setRecipe({
                                        ...recipe,
                                        cookingTime: numberInputValue(
                                            e.target.value,
                                        ),
                                    })
                                }
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                                required
                            />
                            {Number(recipe.cookingTime) >= 60 ? (
                                <p className="mt-2 text-sm text-amber-700">
                                    {formatDuration(recipe.cookingTime)}
                                </p>
                            ) : null}
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Calories
                            </label>
                            <input
                                type="number"
                                value={recipe.calories}
                                onFocus={() =>
                                    clearInitialNumber("calories", 0)
                                }
                                onChange={(e) =>
                                    setRecipe({
                                        ...recipe,
                                        calories: numberInputValue(
                                            e.target.value,
                                        ),
                                    })
                                }
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Carbs
                            </label>
                            <input
                                type="number"
                                value={recipe.carbs}
                                onFocus={() => clearInitialNumber("carbs", 0)}
                                onChange={(e) =>
                                    setRecipe({
                                        ...recipe,
                                        carbs: numberInputValue(e.target.value),
                                    })
                                }
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Protein
                            </label>
                            <input
                                type="number"
                                value={recipe.protein}
                                onFocus={() => clearInitialNumber("protein", 0)}
                                onChange={(e) =>
                                    setRecipe({
                                        ...recipe,
                                        protein: numberInputValue(
                                            e.target.value,
                                        ),
                                    })
                                }
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Fat
                            </label>
                            <input
                                type="number"
                                value={recipe.fat}
                                onFocus={() => clearInitialNumber("fat", 0)}
                                onChange={(e) =>
                                    setRecipe({
                                        ...recipe,
                                        fat: numberInputValue(e.target.value),
                                    })
                                }
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Ingredients
                            </label>
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <input
                                        value={ingredientInput}
                                        onChange={(e) =>
                                            setIngredientInput(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addIngredient();
                                            }
                                        }}
                                        placeholder="e.g. 2 tomatoes"
                                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-amber-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={addIngredient}
                                        className="shrink-0 rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                                    >
                                        Add
                                    </button>
                                </div>
                                {ingredients.length ? (
                                    <div className="flex flex-wrap gap-2">
                                        {ingredients.map(
                                            (ingredient, index) => (
                                                <span
                                                    key={`${ingredient}-${index}`}
                                                    className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-100 py-1.5 pl-3 pr-1.5 text-sm font-medium text-amber-900"
                                                >
                                                    {ingredient}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setIngredients(
                                                                (items) =>
                                                                    items.filter(
                                                                        (
                                                                            _,
                                                                            itemIndex,
                                                                        ) =>
                                                                            itemIndex !==
                                                                            index,
                                                                    ),
                                                            )
                                                        }
                                                        className="flex h-5 w-5 items-center justify-center rounded-full text-amber-800 transition hover:bg-amber-200"
                                                        aria-label={`Remove ${ingredient}`}
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ),
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Instructions
                            </label>
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <input
                                        value={instructionInput}
                                        onChange={(e) =>
                                            setInstructionInput(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addInstruction();
                                            }
                                        }}
                                        placeholder="e.g. Heat oil in a pan"
                                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-amber-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={addInstruction}
                                        className="shrink-0 rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                                    >
                                        Add
                                    </button>
                                </div>
                                {instructions.length ? (
                                    <div className="flex flex-wrap gap-2">
                                        {instructions.map(
                                            (instruction, index) => (
                                                <span
                                                    key={`${instruction}-${index}`}
                                                    className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-100 py-1.5 pl-2 pr-1.5 text-sm font-medium text-amber-900"
                                                >
                                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 text-xs font-semibold">
                                                        {index + 1}
                                                    </span>
                                                    {instruction}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setInstructions(
                                                                (items) =>
                                                                    items.filter(
                                                                        (
                                                                            _,
                                                                            itemIndex,
                                                                        ) =>
                                                                            itemIndex !==
                                                                            index,
                                                                    ),
                                                            )
                                                        }
                                                        className="flex h-5 w-5 items-center justify-center rounded-full text-amber-800 transition hover:bg-amber-200"
                                                        aria-label={`Remove step ${index + 1}`}
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ),
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    {error ? (
                        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {error}
                        </p>
                    ) : null}

                    <div className="relative inline-block">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-6 py-3 font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                        >
                            {saving ? (
                                <>
                                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                                    {id ? "Updating recipe..." : "Saving recipe..."}
                                </>
                            ) : id ? (
                                "Update recipe"
                            ) : (
                                "Save recipe"
                            )}
                        </button>
                        {showConfetti ? (
                            <FoodConfetti
                                onFinish={() => setShowConfetti(false)}
                            />
                        ) : null}
                    </div>
                </form>
            </div>
        </div>
    );
};
