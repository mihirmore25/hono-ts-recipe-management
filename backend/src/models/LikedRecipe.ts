import mongoose, { ObjectId, Document, Schema } from "mongoose";

export interface ILikedRecipe extends Document {
    _id: ObjectId;
    user: ObjectId;
    recipe: ObjectId;
    likedAt: Date;
}

const likedRecipeSchema = new Schema<ILikedRecipe>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        recipe: {
            type: Schema.Types.ObjectId,
            ref: "Recipe",
            required: true,
        },
        likedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Prevents duplicate likes
likedRecipeSchema.index({ user: 1, recipe: 1 }, { unique: true });

export const LikedRecipe = mongoose.model("LikedRecipe", likedRecipeSchema);
