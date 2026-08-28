import { Context } from "hono";
import { User, type IUserSchema } from "../models/User";
import { isValidObjectId, DeleteResult } from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { encodeBase64 } from "hono/utils/encode";

export const updateUserProfile = async (c: Context) => {
    const userId = c.req.param("id");
    const authenticatedUser = c.get("user") as IUserSchema | undefined;

    if (!authenticatedUser || !isValidObjectId(userId)) {
        return c.json({ status: false, message: "Invalid user profile." }, 400);
    }

    if (
        authenticatedUser._id.toString() !== userId &&
        authenticatedUser.role !== "admin"
    ) {
        return c.json(
            { status: false, message: "You can only update your own profile." },
            403,
        );
    }

    const formData = await c.req.formData();
    const username = String(formData.get("username") ?? "").trim();
    const image = formData.get("image");
    const user = await User.findById(userId).select(
        "-password -resetPasswordToken -resetPasswordExpires -__v",
    );

    if (!user) {
        return c.json({ status: false, message: "User profile not found." }, 404);
    }

    if (username) user.username = username;

    if (image && typeof image === "object" && "arrayBuffer" in image) {
        const base64 = encodeBase64(await (image as File).arrayBuffer());
        const uploadedImage = await cloudinary.uploader.upload(
            `data:image/png;base64,${base64}`,
            { resource_type: "auto", folder: "hono_profile_images" },
        );

        if (user.profileImage?.publicId) {
            await cloudinary.uploader.destroy(user.profileImage.publicId);
        }

        user.profileImage = {
            publicId: uploadedImage.public_id,
            imageUrl: uploadedImage.secure_url || uploadedImage.url,
        };
    }

    await user.save();
    const profile = user.toObject();

    return c.json(
        { status: true, data: profile, message: "Profile updated successfully." },
        200,
    );
};

export const getUserProfile = async (c: Context) => {
    const authenticatedUser = c.get("user") as IUserSchema | undefined;

    if (!authenticatedUser?._id) {
        return c.json(
            {
                status: false,
                message: "Unable to identify the authenticated user.",
            },
            401,
        );
    }

    const user = await User.findById(authenticatedUser._id).select(
        "-password -resetPasswordToken -resetPasswordExpires -__v",
    );

    if (!user) {
        return c.json(
            {
                status: false,
                message: "User profile not found.",
            },
            404,
        );
    }

    return c.json(
        {
            status: true,
            data: user.toObject(),
            message: "User profile fetched successfully.",
        },
        200,
    );
};

export const createUser = async (c: Context) => {
    const { username, email, password, role }: IUserSchema = await c.req.json();

    if (!username || !email || !password) {
        return c.json(
            {
                status: false,
                data: [],
                message: "Username, Email & Password, Role are required.",
            },
            400
        );
    }

    const newUser: IUserSchema = new User({
        username,
        email,
        password,
        role,
    });

    const isUserExist: IUserSchema | null = await User.findOne({ email });
    if (isUserExist)
        return c.json(
            {
                status: false,
                data: [],
                message:
                    "It seems you already have an user, please try creating user with different email.",
            },
            400
        );

    const savedUser = await newUser.save();
    return c.json(
        {
            status: true,
            message: "Your user account has been created successfully.",
            data: savedUser.toObject(),
        },
        201
    );
};

export const getUsers = async (c: Context) => {
    const users: IUserSchema[] = await User.find({})
        .select("+password")
        .sort({ createdAt: -1 })
        .limit(50);

    if (users.length <= 0) {
        return c.json(
            {
                status: false,
                data: [],
                message: "No Users found! Please try again or create new User.",
            },
            404
        );
    }

    return c.json(
        {
            status: true,
            data: users,
            message: "Users found successfully.",
        },
        200
    );
};

export const getUser = async (c: Context) => {
    const userId = c.req.param("id");

    if (!isValidObjectId(userId)) {
        return c.json(
            {
                status: false,
                message: "Please search user with valid user id.",
            },
            404
        );
    }

    const user: IUserSchema | null = await User.findById(userId);

    if (!user) {
        return c.json(
            {
                status: false,
                message: `User did not found with ${userId} id`,
            },
            404
        );
    }

    return c.json(
        {
            status: true,
            data: user,
        },
        200
    );
};

export const deleteUser = async (c: Context) => {
    const userId = c.req.param("id");

    if (!isValidObjectId(userId)) {
        return c.json(
            {
                status: false,
                message: "Please search user with valid user id.",
            },
            400
        );
    }

    const user: IUserSchema | null = await User.findById(userId);

    if (!user) {
        return c.json(
            {
                status: false,
                message: `User did not found with ${userId} id.`,
            },
            404
        );
    }

    const deletedUser: DeleteResult | null = await User.findByIdAndDelete(
        userId
    );

    return c.json(
        {
            status: true,
            data: deletedUser,
            message: "User has been deleted successfully.",
        },
        200
    );
};
