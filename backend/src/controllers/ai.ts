import { Context } from "hono";

const generatedRecipeFields = [
    "title",
    "description",
    "totalTime",
    "prepTime",
    "cookingTime",
    "ingredients",
    "instructions",
    "calories",
    "carbs",
    "protein",
    "fat",
] as const;

type GeneratedRecipe = {
    title: string;
    description: string;
    totalTime: number;
    prepTime: number;
    cookingTime: number;
    ingredients: string[];
    instructions: string[];
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
};

const isNonNegativeInteger = (value: unknown): value is number =>
    typeof value === "number" && Number.isInteger(value) && value >= 0;

const normalizeGeneratedList = (
    value: unknown,
    type: "ingredient" | "instruction",
) => {
    if (!Array.isArray(value)) return [];

    return value
        .flatMap((item) => {
            if (typeof item !== "string") return [];
            const text = item.replace(/\s+/g, " ").trim();
            const pattern =
                type === "instruction"
                    ? /(?=\b\d+\.\s*)/
                    : /(?=\b\d+(?:[./]\d+)?\s+(?:oz|lb|g|kg|ml|l|cup|cups|tbsp|tsp|tablespoons?|teaspoons?|cloves?|can|small|medium|large)\b)/i;

            return text
                .split(pattern)
                .map((part) => part.replace(/^\d+\.\s*/, "").trim())
                .filter(Boolean);
        })
        .filter(Boolean);
};

const validateGeneratedRecipe = (value: unknown): GeneratedRecipe | null => {
    if (!value || typeof value !== "object") return null;

    const recipe = value as Record<string, unknown>;
    const hasText = (field: string) =>
        typeof recipe[field] === "string" && recipe[field].trim().length > 0;
    const ingredients = normalizeGeneratedList(recipe.ingredients, "ingredient");
    const instructions = normalizeGeneratedList(
        recipe.instructions,
        "instruction",
    );

    if (
        !generatedRecipeFields
            .filter((field) => ["title", "description"].includes(field))
            .every(hasText) ||
        !ingredients.length ||
        !instructions.length ||
        !generatedRecipeFields
            .filter(
                (field) =>
                    !["title", "description", "ingredients", "instructions"].includes(
                        field,
                    ),
            )
            .every((field) => isNonNegativeInteger(recipe[field]))
    ) {
        return null;
    }

    return {
        title: (recipe.title as string).trim(),
        description: (recipe.description as string).trim(),
        totalTime: recipe.totalTime as number,
        prepTime: recipe.prepTime as number,
        cookingTime: recipe.cookingTime as number,
        ingredients,
        instructions,
        calories: recipe.calories as number,
        carbs: recipe.carbs as number,
        protein: recipe.protein as number,
        fat: recipe.fat as number,
    };
};

export const generateRecipe = async (c: Context) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return c.json(
            { status: false, message: "Gemini AI is not configured on the server." },
            503,
        );
    }

    const body = await c.req.json<{ idea?: string }>();
    const idea = body.idea?.trim();

    if (!idea || idea.length < 3 || idea.length > 500) {
        return c.json(
            {
                status: false,
                message: "Provide a recipe idea between 3 and 500 characters.",
            },
            400,
        );
    }

    const prompt = `Create one practical recipe based on this user idea:
"${idea}"

Return only valid JSON with exactly these fields:
title (string), description (string), totalTime (non-negative integer minutes),
prepTime (non-negative integer minutes), cookingTime (non-negative integer minutes),
ingredients (array of strings), instructions (array of strings),
calories (non-negative integer), carbs (non-negative integer grams),
protein (non-negative integer grams), fat (non-negative integer grams).

Return every ingredient as its own array item and every cooking step as its own array item.
Do not combine multiple ingredients or steps into one string. Nutrition values are estimates.
Do not include markdown, code fences, or any fields other than the requested fields.`;

    const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    responseMimeType: "application/json",
                },
            }),
        },
    );

    if (!response.ok) {
        const providerError = await response.text();
        console.error("Gemini recipe generation failed:", providerError);
        return c.json(
            { status: false, message: "Gemini could not generate this recipe." },
            502,
        );
    }

    const result = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        return c.json(
            { status: false, message: "Gemini returned an empty recipe." },
            502,
        );
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        return c.json(
            { status: false, message: "Gemini returned an invalid recipe format." },
            502,
        );
    }

    const recipe = validateGeneratedRecipe(parsed);
    if (!recipe) {
        return c.json(
            { status: false, message: "Gemini returned incomplete recipe data." },
            502,
        );
    }

    return c.json({ status: true, data: recipe }, 200);
};
