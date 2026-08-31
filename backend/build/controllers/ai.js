"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRecipe = void 0;
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
];
const isNonNegativeInteger = (value) => typeof value === "number" && Number.isInteger(value) && value >= 0;
const normalizeGeneratedList = (value, type) => {
    if (!Array.isArray(value))
        return [];
    return value
        .flatMap((item) => {
        if (typeof item !== "string")
            return [];
        const text = item.replace(/\s+/g, " ").trim();
        const pattern = type === "instruction"
            ? /(?=\b\d+\.\s*)/
            : /(?=\b\d+(?:[./]\d+)?\s+(?:oz|lb|g|kg|ml|l|cup|cups|tbsp|tsp|tablespoons?|teaspoons?|cloves?|can|small|medium|large)\b)/i;
        return text
            .split(pattern)
            .map((part) => part.replace(/^\d+\.\s*/, "").trim())
            .filter(Boolean);
    })
        .filter(Boolean);
};
const validateGeneratedRecipe = (value) => {
    if (!value || typeof value !== "object")
        return null;
    const recipe = value;
    const hasText = (field) => typeof recipe[field] === "string" && recipe[field].trim().length > 0;
    const ingredients = normalizeGeneratedList(recipe.ingredients, "ingredient");
    const instructions = normalizeGeneratedList(recipe.instructions, "instruction");
    if (!generatedRecipeFields
        .filter((field) => ["title", "description"].includes(field))
        .every(hasText) ||
        !ingredients.length ||
        !instructions.length ||
        !generatedRecipeFields
            .filter((field) => !["title", "description", "ingredients", "instructions"].includes(field))
            .every((field) => isNonNegativeInteger(recipe[field]))) {
        return null;
    }
    return {
        title: recipe.title.trim(),
        description: recipe.description.trim(),
        totalTime: recipe.totalTime,
        prepTime: recipe.prepTime,
        cookingTime: recipe.cookingTime,
        ingredients,
        instructions,
        calories: recipe.calories,
        carbs: recipe.carbs,
        protein: recipe.protein,
        fat: recipe.fat,
    };
};
const generateRecipe = (c) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return c.json({ status: false, message: "Gemini AI is not configured on the server." }, 503);
    }
    const body = yield c.req.json();
    const idea = (_a = body.idea) === null || _a === void 0 ? void 0 : _a.trim();
    if (!idea || idea.length < 3 || idea.length > 500) {
        return c.json({
            status: false,
            message: "Provide a recipe idea between 3 and 500 characters.",
        }, 400);
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
    const response = yield fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                responseMimeType: "application/json",
            },
        }),
    });
    if (!response.ok) {
        const providerError = yield response.text();
        console.error("Gemini recipe generation failed:", providerError);
        return c.json({ status: false, message: "Gemini could not generate this recipe." }, 502);
    }
    const result = (yield response.json());
    const text = (_f = (_e = (_d = (_c = (_b = result.candidates) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.parts) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.text;
    if (!text) {
        return c.json({ status: false, message: "Gemini returned an empty recipe." }, 502);
    }
    let parsed;
    try {
        parsed = JSON.parse(text);
    }
    catch (_g) {
        return c.json({ status: false, message: "Gemini returned an invalid recipe format." }, 502);
    }
    const recipe = validateGeneratedRecipe(parsed);
    if (!recipe) {
        return c.json({ status: false, message: "Gemini returned incomplete recipe data." }, 502);
    }
    return c.json({ status: true, data: recipe }, 200);
});
exports.generateRecipe = generateRecipe;
