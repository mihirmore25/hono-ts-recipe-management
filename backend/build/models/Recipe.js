"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Recipe = void 0;
const mongoose_1 = require("mongoose");
const recipeSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
}, { timestamps: true });
exports.Recipe = (0, mongoose_1.model)("recipe", recipeSchema);
