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
exports.likeRecipe = exports.getUserRecipes = exports.updateRecipe = exports.deleteRecipe = exports.getRecipe = exports.getRecipes = exports.createRecipe = exports.bulkCreateRecipes = void 0;
const Recipe_1 = require("../models/Recipe");
const encode_1 = require("hono/utils/encode");
const cloudinary_1 = require("cloudinary");
const mongoose_1 = require("mongoose");
const User_1 = require("../models/User");
const LikedRecipe_1 = require("../models/LikedRecipe");
const requiredBulkRecipeFields = [
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
    "image",
];
const csvHeaderAliases = {
    title: "title",
    description: "description",
    totaltime: "totalTime",
    preptime: "prepTime",
    cookingtime: "cookingTime",
    ingredients: "ingredients",
    instructions: "instructions",
    calories: "calories",
    carbs: "carbs",
    protein: "protein",
    fat: "fat",
    image: "image",
};
const normalizeCsvHeader = (header) => {
    const normalized = header
        .replace(/^\uFEFF/, "")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, "");
    return csvHeaderAliases[normalized] || normalized;
};
const parseCsv = (content) => {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    for (let index = 0; index < content.length; index += 1) {
        const character = content[index];
        const nextCharacter = content[index + 1];
        if (character === '"' && quoted && nextCharacter === '"') {
            field += '"';
            index += 1;
        }
        else if (character === '"') {
            quoted = !quoted;
        }
        else if (character === "," && !quoted) {
            row.push(field.trim());
            field = "";
        }
        else if ((character === "\n" || character === "\r") && !quoted) {
            if (character === "\r" && nextCharacter === "\n")
                index += 1;
            row.push(field.trim());
            if (row.some((value) => value !== ""))
                rows.push(row);
            row = [];
            field = "";
        }
        else {
            field += character;
        }
    }
    if (field || row.length) {
        row.push(field.trim());
        if (row.some((value) => value !== ""))
            rows.push(row);
    }
    return rows;
};
const bulkCreateRecipes = (c) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const formData = yield c.req.formData();
        const file = formData.get("file");
        if (!file ||
            typeof file !== "object" ||
            !("text" in file) ||
            typeof file.text !== "function") {
            return c.json({ status: false, message: "Please upload a CSV file using the file field." }, 400);
        }
        const rows = parseCsv(yield file.text());
        if (rows.length < 2) {
            return c.json({ status: false, message: "The CSV must contain a header and at least one recipe." }, 400);
        }
        const headers = rows[0].map(normalizeCsvHeader);
        const missingHeaders = requiredBulkRecipeFields.filter((field) => !headers.includes(field));
        if (missingHeaders.length) {
            return c.json({
                status: false,
                message: `Missing CSV columns: ${missingHeaders.join(", ")}.`,
            }, 400);
        }
        const admin = c.get("user");
        const recipesToInsert = [];
        const errors = [];
        for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
            const values = rows[rowIndex];
            const row = Object.fromEntries(headers.map((header, index) => { var _a; return [header, (_a = values[index]) !== null && _a !== void 0 ? _a : ""]; }));
            const numericFields = [
                "totalTime",
                "prepTime",
                "cookingTime",
                "calories",
                "carbs",
                "protein",
                "fat",
            ];
            const invalidNumber = numericFields.find((field) => {
                const value = Number(row[field]);
                return row[field] === "" || !Number.isInteger(value) || value < 0;
            });
            if (!row.title ||
                !row.description ||
                !row.ingredients ||
                !row.instructions ||
                !row.image) {
                errors.push({ row: rowIndex + 1, message: "Required value is missing." });
                continue;
            }
            if (invalidNumber) {
                errors.push({
                    row: rowIndex + 1,
                    message: `${invalidNumber} must be a whole number greater than or equal to 0.`,
                });
                continue;
            }
            try {
                const uploadedImage = yield cloudinary_1.v2.uploader.upload(row.image, {
                    resource_type: "image",
                    folder: "hono_uploads",
                });
                recipesToInsert.push({
                    title: row.title,
                    description: row.description,
                    totalTime: Number(row.totalTime),
                    prepTime: Number(row.prepTime),
                    cookingTime: Number(row.cookingTime),
                    ingredients: row.ingredients.split(";").map((item) => item.trim()),
                    instructions: row.instructions.split(";").map((item) => item.trim()),
                    calories: Number(row.calories),
                    carbs: Number(row.carbs),
                    protein: Number(row.protein),
                    fat: Number(row.fat),
                    recipeImage: {
                        publicId: uploadedImage.public_id,
                        imageUrl: uploadedImage.secure_url || uploadedImage.url,
                    },
                    user: admin._id,
                });
            }
            catch (error) {
                errors.push({
                    row: rowIndex + 1,
                    message: `Image upload failed: ${error.message}`,
                });
            }
        }
        const createdRecipes = recipesToInsert.length
            ? yield Recipe_1.Recipe.insertMany(recipesToInsert)
            : [];
        return c.json({
            status: errors.length === 0,
            data: {
                total: rows.length - 1,
                created: createdRecipes.length,
                failed: errors.length,
                errors,
            },
            message: errors.length
                ? "Bulk import completed with some failed rows."
                : "Bulk recipes imported successfully.",
        }, errors.length === rows.length - 1 ? 400 : 201);
    }
    catch (error) {
        return c.json({ status: false, message: error.message }, 500);
    }
});
exports.bulkCreateRecipes = bulkCreateRecipes;
const createRecipe = (c) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const formBody = yield c.req.formData();
        // create object literal for storing req body of multipart-data
        const reqBody = {};
        for (const [key, value] of formBody.entries()) {
            reqBody[key] = value;
        }
        // console.log(reqBody);
        const { title, description, totalTime, prepTime, cookingTime, ingredients, instructions, calories, carbs, protein, fat, } = reqBody;
        const numericFields = {
            totalTime,
            prepTime,
            cookingTime,
            calories,
            carbs,
            protein,
            fat,
        };
        const hasInvalidNumber = Object.values(numericFields).some((value) => {
            const parsed = Number(value);
            return (value === undefined ||
                value === "" ||
                !Number.isInteger(parsed) ||
                parsed < 0);
        });
        if (hasInvalidNumber) {
            return c.json({
                status: false,
                message: "Numeric values must be whole numbers greater than or equal to 0.",
            }, 400);
        }
        if (!title ||
            !description ||
            totalTime === undefined ||
            prepTime === undefined ||
            cookingTime === undefined ||
            !ingredients ||
            !instructions ||
            calories === undefined ||
            carbs === undefined ||
            protein === undefined ||
            fat === undefined) {
            return c.json({
                status: false,
                error: c.res.status,
                message: "All the given fields are required.",
            }, 400);
        }
        const user = c.get("user");
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
            user: user._id,
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
    var _a;
    const search = ((_a = c.req.query("search")) === null || _a === void 0 ? void 0 : _a.trim()) || "";
    const page = Math.max(Number(c.req.query("page")) || 1, 1);
    const limit = Math.min(Math.max(Number(c.req.query("limit")) || 9, 1), 50);
    const skip = (page - 1) * limit;
    const filter = search ? { $text: { $search: search } } : {};
    const totalRecipes = yield Recipe_1.Recipe.countDocuments(filter);
    const recipes = yield Recipe_1.Recipe.find(filter)
        .skip(skip)
        .limit(limit)
        .sort(search ? { score: { $meta: "textScore" }, createdAt: -1 } : { createdAt: -1 })
        .select("-__v");
    return c.json({
        status: true,
        data: recipes,
        pagination: {
            page,
            limit,
            totalRecipes,
            totalPages: Math.ceil(totalRecipes / limit),
            search,
        },
    });
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
    const recipe = yield Recipe_1.Recipe.findById(recipeId)
        .populate({
        path: "user",
        model: "user",
        select: "username email profileImage",
    })
        .select("-__v -createdAt -updatedAt");
    if (!recipe) {
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
        const numericFields = {
            totalTime,
            prepTime,
            cookingTime,
            calories,
            carbs,
            protein,
            fat,
        };
        const hasInvalidNumber = Object.values(numericFields).some((value) => {
            const parsed = Number(value);
            return (value === undefined ||
                value === "" ||
                !Number.isInteger(parsed) ||
                parsed < 0);
        });
        if (hasInvalidNumber) {
            return c.json({
                status: false,
                message: "Numeric values must be whole numbers greater than or equal to 0.",
            }, 400);
        }
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
    var _a;
    const userId = c.req.param("id");
    const search = ((_a = c.req.query("search")) === null || _a === void 0 ? void 0 : _a.trim()) || "";
    const page = Math.max(Number(c.req.query("page")) || 1, 1);
    const limit = Math.min(Math.max(Number(c.req.query("limit")) || 8, 1), 50);
    const skip = (page - 1) * limit;
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
    const filter = search
        ? { user: userId, $text: { $search: search } }
        : { user: userId };
    const totalRecipes = yield Recipe_1.Recipe.countDocuments(filter);
    const recipes = yield Recipe_1.Recipe.find(filter)
        .skip(skip)
        .limit(limit)
        .sort(search ? { score: { $meta: "textScore" }, createdAt: -1 } : { createdAt: -1 });
    return c.json({
        status: true,
        data: {
            numberOfRecipes: totalRecipes,
            recipes,
            user,
            pagination: {
                page,
                limit,
                totalRecipes,
                totalPages: Math.ceil(totalRecipes / limit),
                search,
            },
        },
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
