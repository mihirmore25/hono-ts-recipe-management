import { Context, Next } from "hono";
import { IUserSchema } from "../models/User";

export const isAdmin = async (c: Context, next: Next) => {
    const user: IUserSchema = c.get("user");
    const { role } = user;

    if (role !== "admin") {
        return c.json({
            status: false,
            message: "You are not authorized to access this page.",
        });
    }

    await next();
};
