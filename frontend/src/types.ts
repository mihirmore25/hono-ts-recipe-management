export interface User {
    _id?: string;
    id?: string;
    username: string;
    email: string;
    role?: "user" | "admin";
}

export interface Recipe {
    _id?: string;
    title: string;
    description: string;
    totalTime: number;
    prepTime: number;
    cookingTime: number;
    ingredients: string[] | string;
    instructions: string[] | string;
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
    likes?: number;
    recipeImage?: {
        publicId?: string;
        imageUrl?: string;
    };
    user?: string | User;
    createdAt?: string;
    updatedAt?: string;
}
