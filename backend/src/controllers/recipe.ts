import { IRecipeSchema, Recipe } from "../models/Recipe";
import { Context } from "hono";
import { encodeBase64 } from "hono/utils/encode";
import { v2 as cloudinary } from "cloudinary";
import { isValidObjectId } from "mongoose";
import { IUserSchema, User } from "../models/User";
import { ILikedRecipe, LikedRecipe } from "../models/LikedRecipe";

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
] as const;

const csvHeaderAliases: Record<string, string> = {
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

const normalizeCsvHeader = (header: string) => {
    const normalized = header
        .replace(/^\uFEFF/, "")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, "");

    return csvHeaderAliases[normalized] || normalized;
};

const parseCsv = (content: string): string[][] => {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = "";
    let quoted = false;

    for (let index = 0; index < content.length; index += 1) {
        const character = content[index];
        const nextCharacter = content[index + 1];

        if (character === '"' && quoted && nextCharacter === '"') {
            field += '"';
            index += 1;
        } else if (character === '"') {
            quoted = !quoted;
        } else if (character === "," && !quoted) {
            row.push(field.trim());
            field = "";
        } else if ((character === "\n" || character === "\r") && !quoted) {
            if (character === "\r" && nextCharacter === "\n") index += 1;
            row.push(field.trim());
            if (row.some((value) => value !== "")) rows.push(row);
            row = [];
            field = "";
        } else {
            field += character;
        }
    }

    if (field || row.length) {
        row.push(field.trim());
        if (row.some((value) => value !== "")) rows.push(row);
    }

    return rows;
};

export const bulkCreateRecipes = async (c: Context) => {
    try {
        const formData = await c.req.formData();
        const file = formData.get("file");

        if (
            !file ||
            typeof file !== "object" ||
            !("text" in file) ||
            typeof (file as File).text !== "function"
        ) {
            return c.json(
                { status: false, message: "Please upload a CSV file using the file field." },
                400,
            );
        }

        const rows = parseCsv(await (file as File).text());
        if (rows.length < 2) {
            return c.json(
                { status: false, message: "The CSV must contain a header and at least one recipe." },
                400,
            );
        }

        const headers = rows[0].map(normalizeCsvHeader);
        const missingHeaders = requiredBulkRecipeFields.filter(
            (field) => !headers.includes(field),
        );
        if (missingHeaders.length) {
            return c.json(
                {
                    status: false,
                    message: `Missing CSV columns: ${missingHeaders.join(", ")}.`,
                },
                400,
            );
        }

        const admin = c.get("user") as IUserSchema;
        const recipesToInsert: Partial<IRecipeSchema>[] = [];
        const errors: { row: number; message: string }[] = [];

        for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
            const values = rows[rowIndex];
            const row = Object.fromEntries(
                headers.map((header, index) => [header, values[index] ?? ""]),
            );
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

            if (
                !row.title ||
                !row.description ||
                !row.ingredients ||
                !row.instructions ||
                !row.image
            ) {
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
                const uploadedImage = await cloudinary.uploader.upload(row.image, {
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
            } catch (error) {
                errors.push({
                    row: rowIndex + 1,
                    message: `Image upload failed: ${(error as Error).message}`,
                });
            }
        }

        const createdRecipes = recipesToInsert.length
            ? await Recipe.insertMany(recipesToInsert)
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
    } catch (error) {
        return c.json({ status: false, message: (error as Error).message }, 500);
    }
};

export const createRecipe = async (c: Context) => {
    try {
        const formBody = await c.req.formData();

        // create object literal for storing req body of multipart-data
        const reqBody: Record<string, string | File> = {};

        for (const [key, value] of formBody.entries()) {
            reqBody[key] = value;
        }

        // console.log(reqBody);
        const {
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
        } = reqBody;

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
            return (
                value === undefined ||
                value === "" ||
                !Number.isInteger(parsed) ||
                parsed < 0
            );
        });

        if (hasInvalidNumber) {
            return c.json(
                {
                    status: false,
                    message: "Numeric values must be whole numbers greater than or equal to 0.",
                },
                400,
            );
        }

        if (
            !title ||
            !description ||
            totalTime === undefined ||
            prepTime === undefined ||
            cookingTime === undefined ||
            !ingredients ||
            !instructions ||
            calories === undefined ||
            carbs === undefined ||
            protein === undefined ||
            fat === undefined
        ) {
            return c.json(
                {
                    status: false,
                    error: c.res.status,
                    message: "All the given fields are required.",
                },
                400,
            );
        }

        const user = c.get("user") as IUserSchema;

        const body = await c.req.parseBody();
        const image = body["image"];

        if (
            !image ||
            typeof image !== "object" ||
            !("arrayBuffer" in image) ||
            typeof (image as File).arrayBuffer !== "function"
        ) {
            return c.json(
                {
                    status: false,
                    message: "Please upload a valid recipe image.",
                },
                400,
            );
        }

        const byteArrayBuffer = await (image as File).arrayBuffer();
        const base64 = encodeBase64(byteArrayBuffer);
        const recipeImage = await cloudinary.uploader.upload(
            `data:image/png;base64,${base64}`,
            { resource_type: "auto", folder: "hono_uploads" },
        );

        console.log("file is uploaded on cloudinary ", recipeImage.url);
        // return c.json(recipeImage);

        const newRecipe: IRecipeSchema = await Recipe.create({
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

        const newCreatedRecipe = await newRecipe.save();

        // console.log(newCreatedRecipe.toObject());

        return c.json({
            status: true,
            data: [newCreatedRecipe.toObject()],
            message: "New Recipe created successfully.",
        });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

export const getRecipes = async (c: Context) => {
    const search = c.req.query("search")?.trim() || "";
    const page = Math.max(Number(c.req.query("page")) || 1, 1);
    const limit = Math.min(Math.max(Number(c.req.query("limit")) || 8, 1), 50);
    const skip = (page - 1) * limit;
    const filter = search ? { $text: { $search: search } } : {};
    const totalRecipes = await Recipe.countDocuments(filter);
    const recipes: IRecipeSchema[] = await Recipe.find(filter)
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
};

export const getRecipe = async (c: Context) => {
    const recipeId = c.req.param("id");

    if (!isValidObjectId(recipeId) || !recipeId) {
        return c.json(
            {
                status: false,
                message: "Please search recipe with valid recipe id.",
            },
            404,
        );
    }

    const recipe: IRecipeSchema | null = await Recipe.findById(recipeId).select(
        "-__v -createdAt -updatedAt",
    );

    if (recipe === null || undefined || 0) {
        return c.json(
            {
                status: false,
                message: `Recipe did not found with ${recipeId} id.`,
            },
            404,
        );
    }

    return c.json(
        {
            status: true,
            data: recipe,
        },
        200,
    );
};

export const deleteRecipe = async (c: Context) => {
    try {
        const recipeId = c.req.param("id");

        if (!isValidObjectId(recipeId) || !recipeId) {
            return c.json(
                {
                    status: false,
                    message: "Please search recipe with valid recipe id.",
                },
                404,
            );
        }

        const recipe: IRecipeSchema | null = await Recipe.findById(
            recipeId,
        ).select("-__v -createdAt -updatedAt");

        if (recipe === null || undefined || 0) {
            return c.json(
                {
                    status: false,
                    message: `Recipe did not found with ${recipeId} id.`,
                },
                404,
            );
        }

        const user: IUserSchema = c.get("user");

        if (
            user._id.toString() === recipe.user.toString() ||
            user.role === "admin"
        ) {
            const deletedRecipe: IRecipeSchema | null =
                await Recipe.findByIdAndDelete(recipeId).select(
                    "-__v -createdAt -updatedAt",
                );

            console.log("Deleted Recipe --> ", deletedRecipe);

            const deleteImageFromCloudinary = await cloudinary.uploader.destroy(
                recipe.recipeImage.publicId,
            );
            console.log(deleteImageFromCloudinary);

            return c.json(
                {
                    status: true,
                    data: deletedRecipe,
                    message: "Recipe has been deleted successfully.",
                },
                200,
            );
        }

        return c.json({
            status: false,
            message: "You can only delete your own recipe.",
        });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

export const updateRecipe = async (c: Context) => {
    try {
        const formBody = await c.req.formData();

        // create object literal for storing req body of multipart-data
        const reqBody: Record<string, string | File> = {};

        for (const [key, value] of formBody.entries()) {
            reqBody[key] = value;
        }

        // console.log(reqBody);
        const {
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
        } = reqBody;

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
            return (
                value === undefined ||
                value === "" ||
                !Number.isInteger(parsed) ||
                parsed < 0
            );
        });

        if (hasInvalidNumber) {
            return c.json(
                {
                    status: false,
                    message: "Numeric values must be whole numbers greater than or equal to 0.",
                },
                400,
            );
        }

        const recipeId = c.req.param("id");

        if (!isValidObjectId(recipeId) || !recipeId) {
            return c.json(
                {
                    status: false,
                    message: "Please search recipe with valid recipe id.",
                },
                404,
            );
        }

        const recipe: IRecipeSchema | null = await Recipe.findById(
            recipeId,
        ).select("-__v -createdAt -updatedAt");

        if (recipe === null || undefined || 0) {
            return c.json(
                {
                    status: false,
                    message: `Recipe did not found with ${recipeId} id.`,
                },
                404,
            );
        }

        const user: IUserSchema = c.get("user");

        if (
            user._id.toString() === recipe.user.toString() ||
            user.role === "admin"
        ) {
            const body = await c.req.parseBody();
            const image = body["image"];

            if (image) {
                if (
                    typeof image !== "object" ||
                    !("arrayBuffer" in image) ||
                    typeof (image as File).arrayBuffer !== "function"
                ) {
                    return c.json(
                        {
                            status: false,
                            message: "Please upload a valid recipe image.",
                        },
                        400,
                    );
                }

                const byteArrayBuffer = await (image as File).arrayBuffer();
                const base64 = encodeBase64(byteArrayBuffer);
                const recipeImage = await cloudinary.uploader.upload(
                    `data:image/png;base64,${base64}`,
                    { resource_type: "auto", folder: "hono_uploads" },
                );

                console.log("file is uploaded on cloudinary ", recipeImage.url);

                console.log(recipe.recipeImage);

                const deleteImageFromCloudinary =
                    await cloudinary.uploader.destroy(
                        recipe.recipeImage.publicId,
                    );
                console.log(deleteImageFromCloudinary);

                // Update recipeImage only if new image is provided
                recipe.recipeImage = {
                    publicId:
                        recipeImage.public_id || recipe.recipeImage.publicId,
                    imageUrl: recipeImage.url || recipe.recipeImage.imageUrl,
                };
            }

            const updatedRecipe: IRecipeSchema | null =
                await Recipe.findByIdAndUpdate(
                    recipeId,
                    {
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
                    },
                    { new: true },
                ).select("-__V");

            console.log("Updated Recipe --> ", updatedRecipe);

            return c.json(
                {
                    status: true,
                    data: updatedRecipe,
                    message: "Recipe has been updated successfully.",
                },
                200,
            );
        }

        return c.json({
            status: false,
            message: "You can only update your own recipe.",
        });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

export const getUserRecipes = async (c: Context) => {
    const userId = c.req.param("id");
    const search = c.req.query("search")?.trim() || "";
    const page = Math.max(Number(c.req.query("page")) || 1, 1);
    const limit = Math.min(Math.max(Number(c.req.query("limit")) || 8, 1), 50);
    const skip = (page - 1) * limit;

    if (!isValidObjectId(userId) || !userId) {
        return c.json(
            {
                status: false,
                message: "Please search user with valid user id.",
            },
            404,
        );
    }

    const user: IUserSchema | null = await User.findById(userId);

    if (!user)
        return c.json(
            {
                status: false,
                message: "User did not found! Or it does not exist!",
                data: [],
            },
            404,
        );

    const filter = search
        ? { user: userId, $text: { $search: search } }
        : { user: userId };
    const totalRecipes = await Recipe.countDocuments(filter);
    const recipes: IRecipeSchema[] = await Recipe.find(filter)
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
};

export const likeRecipe = async (c: Context) => {
    try {
        const user_data = c.get("user");
        const userId = user_data._id;
        // console.log("User Id: ", userId);

        const recipeId = c.req.param("id");
        // console.log("Recipe Id: ", recipeId);

        // Validate Recipe Id format
        if (!recipeId || !isValidObjectId(recipeId)) {
            return c.json(
                {
                    status: false,
                    message: "Recipe did not found!",
                },
                404,
            );
        }

        // Find Recipe
        const recipe: IRecipeSchema | null = await Recipe.findOne({
            _id: recipeId,
        })
            .select("-__v")
            .lean();

        // If recipe not found show error
        if (recipe === null || undefined || 0) {
            return c.json(
                {
                    status: false,
                    message: "Recipe did not found!",
                },
                404,
            );
        }

        // Check if user has already liked this recipe
        const alreadyLiked: ILikedRecipe | null = await LikedRecipe.findOne({
            user: userId,
            recipe: recipeId,
        });

        // If already liked by user
        if (alreadyLiked) {
            return c.json(
                {
                    status: true,
                    message: "Recipe already liked.",
                    alreadyLiked: true,
                    data: { likes: recipe.likes },
                },
                200,
            );
        }

        // Always have the latest likedAt timestamp
        await LikedRecipe.updateOne(
            {
                user: userId,
                recipe: recipeId,
            },
            {
                $set: {
                    likedAt: new Date(),
                },
            },
            { upsert: true }, // creates a new doc if it doesn't exist
        );

        // Increment like count
        const updatedRecipe = await Recipe.findByIdAndUpdate(
            recipeId,
            { $inc: { likes: 1 } },
            { new: true },
        )
            .select("likes")
            .lean();

        return c.json(
            {
                status: true,
                message: "Recipe liked successfully",
                alreadyLiked: false,
                data: { likes: updatedRecipe?.likes ?? recipe.likes + 1 },
            },
            201,
        );
    } catch (error: any) {
        console.error("Error liking recipe: ", error);
        return c.json(
            {
                error:
                    error.message || "Something went wrong with liking recipe!",
            },
            500,
        );
    }
};
