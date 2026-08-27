import { v2 as cloudinary } from "cloudinary";
import { Context, Next } from "hono";

export const cloudinaryMiddleware = async (c: Context, next: Next) => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    await next();
};
