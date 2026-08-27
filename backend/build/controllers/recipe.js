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
exports.likeRecipe = exports.getUserRecipes = exports.updateRecipe = exports.deleteRecipe = exports.getRecipe = exports.getRecipes = exports.createRecipe = void 0;
const Recipe_1 = require("../models/Recipe");
const jwt_1 = require("hono/jwt");
const cookie_1 = require("hono/cookie");
const encode_1 = require("hono/utils/encode");
const cloudinary_1 = require("cloudinary");
const mongoose_1 = require("mongoose");
const User_1 = require("../models/User");
const LikedRecipe_1 = require("../models/LikedRecipe");
const createRecipe = (c) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = (0, cookie_1.getCookie)(c, "access_token");
        if (!token) {
            return c.json({
                status: false,
                error: c.res.status,
                message: "Not authorize to access this route, Please try logging in first.",
            });
        }
        const formBody = yield c.req.formData();
        // create object literal for storing req body of multipart-data
        const reqBody = {};
        for (const [key, value] of formBody.entries()) {
            reqBody[key] = value;
        }
        // console.log(reqBody);
        const { title, description, totalTime, prepTime, cookingTime, ingredients, instructions, calories, carbs, protein, fat, } = reqBody;
        if (!title ||
            !description ||
            !totalTime ||
            !prepTime ||
            !cookingTime ||
            !ingredients ||
            !instructions ||
            !calories ||
            !carbs ||
            !protein ||
            !fat) {
            return c.json({
                status: false,
                error: c.res.status,
                message: "All the given fields are required.",
            }, 400);
        }
        const user_data = yield (0, jwt_1.verify)(token, process.env.JWT_SECRET || "secret_mihir_jwt");
        if (!user_data)
            return c.json({
                status: false,
                message: "This session has expired. Please login",
            });
        const body = yield c.req.parseBody();
        const image = body["image"];
        if (!image ||
            typeof image !== "object" ||
            !("arrayBuffer" in image) ||
            typeof image.arrayBuffer !== "function") {
            return c.json({
                status: false,
                message: "Please upload a valid recipe image.",
            }, 400);
        }
        const byteArrayBuffer = yield image.arrayBuffer();
        const base64 = (0, encode_1.encodeBase64)(byteArrayBuffer);
        const recipeImage = yield cloudinary_1.v2.uploader.upload(`data:image/png;base64,${base64}`, { resource_type: "auto", folder: "hono_uploads" });
        console.log("file is uploaded on cloudinary ", recipeImage.url);
        // return c.json(recipeImage);
        const newRecipe = yield Recipe_1.Recipe.create({
            recipeImage: {
                publicId: recipeImage.public_id,
                imageUrl: recipeImage.url || "",
            },
            title,
            description,
            totalTime,
            prepTime,
            cookingTime,
            ingredients,
            instructions,
            calories,
            carbs,
            protein,
            fat,
            user: user_data.id,
        });
        const newCreatedRecipe = yield newRecipe.save();
        // console.log(newCreatedRecipe.toObject());
        return c.json({
            status: true,
            data: [newCreatedRecipe.toObject()],
            message: "New Recipe created successfully.",
        });
    }
    catch (error) {
        return c.json({ error: error.message }, 500);
    }
});
exports.createRecipe = createRecipe;
const getRecipes = (c) => __awaiter(void 0, void 0, void 0, function* () {
    const recipes = yield Recipe_1.Recipe.find()
        .sort({ createdAt: -1 })
        .select("-__v");
    if (recipes.length === 0 || recipes === null || 0) {
        return c.json({
            status: false,
            message: "Recipes not found! Try creating new recipe",
        }, 404);
    }
    return c.json({ status: true, data: recipes });
});
exports.getRecipes = getRecipes;
const getRecipe = (c) => __awaiter(void 0, void 0, void 0, function* () {
    const recipeId = c.req.param("id");
    if (!(0, mongoose_1.isValidObjectId)(recipeId) || !recipeId) {
        return c.json({
            status: false,
            message: "Please search recipe with valid recipe id.",
        }, 404);
    }
    const recipe = yield Recipe_1.Recipe.findById(recipeId).select("-__v -createdAt -updatedAt");
    if (recipe === null || undefined || 0) {
        return c.json({
            status: false,
            message: `Recipe did not found with ${recipeId} id.`,
        }, 404);
    }
    return c.json({
        status: true,
        data: recipe,
    }, 200);
});
exports.getRecipe = getRecipe;
const deleteRecipe = (c) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const recipeId = c.req.param("id");
        if (!(0, mongoose_1.isValidObjectId)(recipeId) || !recipeId) {
            return c.json({
                status: false,
                message: "Please search recipe with valid recipe id.",
            }, 404);
        }
        const recipe = yield Recipe_1.Recipe.findById(recipeId).select("-__v -createdAt -updatedAt");
        if (recipe === null || undefined || 0) {
            return c.json({
                status: false,
                message: `Recipe did not found with ${recipeId} id.`,
            }, 404);
        }
        const user = c.get("user");
        if (user._id.toString() === recipe.user.toString() ||
            user.role === "admin") {
            const deletedRecipe = yield Recipe_1.Recipe.findByIdAndDelete(recipeId).select("-__v -createdAt -updatedAt");
            console.log("Deleted Recipe --> ", deletedRecipe);
            const deleteImageFromCloudinary = yield cloudinary_1.v2.uploader.destroy(recipe.recipeImage.publicId);
            console.log(deleteImageFromCloudinary);
            return c.json({
                status: true,
                data: deletedRecipe,
                message: "Recipe has been deleted successfully.",
            }, 200);
        }
        return c.json({
            status: false,
            message: "You can only delete your own recipe.",
        });
    }
    catch (error) {
        return c.json({ error: error.message }, 500);
    }
});
exports.deleteRecipe = deleteRecipe;
const updateRecipe = (c) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const formBody = yield c.req.formData();
        // create object literal for storing req body of multipart-data
        const reqBody = {};
        for (const [key, value] of formBody.entries()) {
            reqBody[key] = value;
        }
        // console.log(reqBody);
        const { title, description, totalTime, prepTime, cookingTime, ingredients, instructions, calories, carbs, protein, fat, } = reqBody;
        const recipeId = c.req.param("id");
        if (!(0, mongoose_1.isValidObjectId)(recipeId) || !recipeId) {
            return c.json({
                status: false,
                message: "Please search recipe with valid recipe id.",
            }, 404);
        }
        const recipe = yield Recipe_1.Recipe.findById(recipeId).select("-__v -createdAt -updatedAt");
        if (recipe === null || undefined || 0) {
            return c.json({
                status: false,
                message: `Recipe did not found with ${recipeId} id.`,
            }, 404);
        }
        const user = c.get("user");
        if (user._id.toString() === recipe.user.toString() ||
            user.role === "admin") {
            const body = yield c.req.parseBody();
            const image = body["image"];
            if (image) {
                if (typeof image !== "object" ||
                    !("arrayBuffer" in image) ||
                    typeof image.arrayBuffer !== "function") {
                    return c.json({
                        status: false,
                        message: "Please upload a valid recipe image.",
                    }, 400);
                }
                const byteArrayBuffer = yield image.arrayBuffer();
                const base64 = (0, encode_1.encodeBase64)(byteArrayBuffer);
                const recipeImage = yield cloudinary_1.v2.uploader.upload(`data:image/png;base64,${base64}`, { resource_type: "auto", folder: "hono_uploads" });
                console.log("file is uploaded on cloudinary ", recipeImage.url);
                console.log(recipe.recipeImage);
                const deleteImageFromCloudinary = yield cloudinary_1.v2.uploader.destroy(recipe.recipeImage.publicId);
                console.log(deleteImageFromCloudinary);
                // Update recipeImage only if new image is provided
                recipe.recipeImage = {
                    publicId: recipeImage.public_id || recipe.recipeImage.publicId,
                    imageUrl: recipeImage.url || recipe.recipeImage.imageUrl,
                };
            }
            const updatedRecipe = yield Recipe_1.Recipe.findByIdAndUpdate(recipeId, {
                $set: {
                    recipeImage: recipe.recipeImage,
                    title,
                    description,
                    totalTime,
                    prepTime,
                    cookingTime,
                    ingredients,
                    instructions,
                    calories,
                    carbs,
                    protein,
                    fat,
                },
            }, { new: true }).select("-__V");
            console.log("Updated Recipe --> ", updatedRecipe);
            return c.json({
                status: true,
                data: updatedRecipe,
                message: "Recipe has been updated successfully.",
            }, 200);
        }
        return c.json({
            status: false,
            message: "You can only update your own recipe.",
        });
    }
    catch (error) {
        return c.json({ error: error.message }, 500);
    }
});
exports.updateRecipe = updateRecipe;
const getUserRecipes = (c) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = c.req.param("id");
    if (!(0, mongoose_1.isValidObjectId)(userId) || !userId) {
        return c.json({
            status: false,
            message: "Please search user with valid user id.",
        }, 404);
    }
    const user = yield User_1.User.findById(userId);
    if (!user)
        return c.json({
            status: false,
            message: "User did not found! Or it does not exist!",
            data: [],
        }, 404);
    const recipes = yield Recipe_1.Recipe.find({ user: userId }).sort({
        createdAt: -1,
    });
    if (recipes.length === 0) {
        return c.json({
            status: true,
            data: { numberOfRecipes: 0, recipes: [], user },
        });
    }
    return c.json({
        status: true,
        data: { numberOfRecipes: recipes.length, recipes, user },
    });
});
exports.getUserRecipes = getUserRecipes;
const likeRecipe = (c) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_data = c.get("user");
        const userId = user_data._id;
        // console.log("User Id: ", userId);
        const recipeId = c.req.param("id");
        // console.log("Recipe Id: ", recipeId);
        // Validate Recipe Id format
        if (!recipeId || !(0, mongoose_1.isValidObjectId)(recipeId)) {
            return c.json({
                status: false,
                message: "Recipe did not found!",
            }, 404);
        }
        // Find Recipe
        const recipe = yield Recipe_1.Recipe.findOne({
            _id: recipeId,
        })
            .select("-__v")
            .lean();
        // If recipe not found show error
        if (recipe === null || undefined || 0) {
            return c.json({
                status: false,
                message: "Recipe did not found!",
            }, 404);
        }
        // Check if user has already liked this recipe
        const alreadyLiked = yield LikedRecipe_1.LikedRecipe.findOne({
            user: userId,
            recipe: recipeId,
        });
        // If already liked by user
        if (alreadyLiked) {
            return c.json({
                status: true,
                message: "Recipe already liked.",
                alreadyLiked: true,
                data: { likes: recipe.likes },
            }, 200);
        }
        // Always have the latest likedAt timestamp
        yield LikedRecipe_1.LikedRecipe.updateOne({
            user: userId,
            recipe: recipeId,
        }, {
            $set: {
                likedAt: new Date(),
            },
        }, { upsert: true });
        // Increment like count
        const updatedRecipe = yield Recipe_1.Recipe.findByIdAndUpdate(recipeId, { $inc: { likes: 1 } }, { new: true })
            .select("likes")
            .lean();
        return c.json({
            status: true,
            message: "Recipe liked successfully",
            alreadyLiked: false,
            data: { likes: (_a = updatedRecipe === null || updatedRecipe === void 0 ? void 0 : updatedRecipe.likes) !== null && _a !== void 0 ? _a : recipe.likes + 1 },
        }, 201);
    }
    catch (error) {
        console.error("Error liking recipe: ", error);
        return c.json({
            error: error.message || "Something went wrong with liking recipe!",
        }, 500);
    }
});
exports.likeRecipe = likeRecipe;
