import { Schema, Document, model, ObjectId } from "mongoose";

interface IRecipeSchema extends Document {
    _id: ObjectId;
    recipeImage: {
        publicId: string;
        imageUrl: string;
    };
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
    likes: number;
    user: ObjectId;
}

const recipeSchema = new Schema<IRecipeSchema>(
    {
        recipeImage: {
            type: Object,
            publicId: {
                type: String,
                default: null,
            },
            imageUrl: {
                type: String,
                required: [true, "Your recipe image is required."],
                default: null,
            },
        },
        title: {
            type: String,
            required: [true, "Your title is required"],
            max: 50,
        },
        description: {
            type: String,
            required: [true, "Your description is required"],
        },
        totalTime: {
            type: Number,
            required: [true, "Your total cooking time required"],
            default: 0,
        },
        prepTime: {
            type: Number,
            required: [true, "Your preparation time required"],
            default: 0,
        },
        cookingTime: {
            type: Number,
            required: [true, "Your cooking time required"],
            default: 0,
        },
        ingredients: {
            type: [String],
            required: [true, "Your cooking ingredients required"],
            default: [],
        },
        instructions: {
            type: [String],
            required: [true, "Your cooking instructions required"],
            default: [],
        },
        calories: {
            type: Number,
            required: [true, "Your recipe calories required"],
            default: 0,
        },
        carbs: {
            type: Number,
            required: [true, "Your recipe carbs required"],
            default: 0,
        },
        protein: {
            type: Number,
            required: [true, "Your recipe protein required"],
            default: 0,
        },
        fat: {
            type: Number,
            required: [true, "Your recipe fat required"],
            default: 0,
        },
        likes: {
            type: Number,
            default: 0,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

recipeSchema.index({
    title: "text",
    description: "text",
    ingredients: "text",
    instructions: "text",
});

export const Recipe = model("recipe", recipeSchema);
export type { IRecipeSchema };
