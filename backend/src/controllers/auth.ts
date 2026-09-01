import { User, type IUserSchema } from "../models/User";
import { verify } from "hono/jwt";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import type { Context } from "hono";
import { sendResetPasswordEmail } from "../utils/mailer";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { v2 as cloudinary } from "cloudinary";

const normalizeGooglePicture = (picture: string) =>
    picture.replace(/=s\d+(?:-c)?$/, "=s256-c");

const saveGooglePicture = async (picture?: string) => {
    if (!picture) return undefined;

    const uploadedImage = await cloudinary.uploader.upload(
        normalizeGooglePicture(picture),
        { resource_type: "image", folder: "hono_profile_images" },
    );

    return {
        publicId: uploadedImage.public_id,
        imageUrl: uploadedImage.secure_url || uploadedImage.url,
    };
};

export const register = async (c: Context) => {
    const { username, email, password }: IUserSchema = await c.req.json();

    if (!username || !email || !password) {
        return c.json(
            {
                status: false,
                error: c.res.status,
                data: [],
                message: "Username, Email, Password are required",
            },
            400
        );
    }

    const newUser: IUserSchema = new User({
        username,
        email,
        password,
    });

    const isUserExist: IUserSchema | null = await User.findOne({ email });
    if (isUserExist)
        return c.json(
            {
                status: false,
                error: c.res.status,
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
            message:
                "Thank you for registering with us. Your account has been created successfully.",
            data: savedUser.toObject(),
        },
        201
    );
};

export const login = async (c: Context) => {
    const { email, password }: IUserSchema = await c.req.json();

    if (!email || !password) {
        return c.json(
            {
                status: false,
                error: c.res.status,
                data: [],
                message: "Email, Password are required",
            },
            400
        );
    }

    const user: IUserSchema | null = await User.findOne({ email }).select(
        "+password"
    );

    if (!user) {
        return c.json(
            {
                status: false,
                error: c.res.status,
                data: [],
                message:
                    "Invalid email or password. Please try again with the correct credentials.",
            },
            401
        );
    }

    const isPasswordValid = await user.isPasswordValid(password);

    if (!isPasswordValid) {
        return c.json(
            {
                status: false,
                error: c.res.status,
                data: [],
                message:
                    "Invalid email or password. Please try again with the correct credentials.",
            },
            401
        );
    }

    // const { password, ...user_data } = user;

    // let options = {
    //     expiresIn: 24 * 60 * 60 * 1000, // would expire in 1 day
    //     httpOnly: true, // The cookie is only accessible by the web server
    // };

    const token = await user.generateJWT();
    const { password: _password, ...userData } = user.toObject();

    setCookie(c, "access_token", token, {
        maxAge: 30 * 60,
        httpOnly: true,
        sameSite: "None",
        secure: true,
    });

    return c.json({
        status: true,
        data: [userData],
        user: userData,
        token,
        message: "You have successfully logged in.",
    });
};

export const googleLogin = async (c: Context) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const secureCookie = clientUrl.startsWith("https://");

    if (!clientId || !clientSecret || !callbackUrl) {
        return c.json({ status: false, message: "Google login is not configured." }, 503);
    }

    const state = crypto.randomBytes(32).toString("hex");
    const oauthClient = new OAuth2Client(clientId, clientSecret, callbackUrl);
    setCookie(c, "google_oauth_state", state, {
        maxAge: 10 * 60,
        httpOnly: true,
        sameSite: secureCookie ? "None" : "Lax",
        secure: secureCookie,
    });

    return c.redirect(
        oauthClient.generateAuthUrl({
            access_type: "offline",
            scope: ["openid", "email", "profile"],
            state,
            prompt: "select_account",
        }),
    );
};

export const googleCallback = async (c: Context) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const secureCookie = clientUrl.startsWith("https://");
    const code = c.req.query("code");
    const state = c.req.query("state");
    const savedState = getCookie(c, "google_oauth_state");

    if (!clientId || !clientSecret || !callbackUrl || !code || !state || state !== savedState) {
        return c.redirect(`${clientUrl}/login?error=google_auth_failed`);
    }

    try {
        const oauthClient = new OAuth2Client(clientId, clientSecret, callbackUrl);
        const { tokens } = await oauthClient.getToken(code);
        if (!tokens.id_token) throw new Error("Google did not return an ID token.");

        const ticket = await oauthClient.verifyIdToken({
            idToken: tokens.id_token,
            audience: clientId,
        });
        const payload = ticket.getPayload();
        if (!payload?.sub || !payload.email || payload.email_verified !== true) {
            throw new Error("Google account email is not verified.");
        }

        let user = await User.findOne({
            $or: [{ googleId: payload.sub }, { email: payload.email.toLowerCase() }],
        }).select("+password");

        const googleProfileImage = await saveGooglePicture(payload.picture);

        if (!user) {
            user = new User({
                username: payload.name?.trim() || payload.email.split("@")[0],
                email: payload.email.toLowerCase(),
                googleId: payload.sub,
                authProvider: "google",
                profileImage: googleProfileImage || {},
            });
        } else if (!user.googleId) {
            user.googleId = payload.sub;
            user.authProvider = "google";
        }

        if (
            googleProfileImage &&
            (!user.profileImage?.imageUrl ||
                user.profileImage.imageUrl.includes("googleusercontent"))
        ) {
            user.profileImage = googleProfileImage;
        }
        await user.save();

        const token = await user.generateJWT();
        const { password: _password, ...userData } = user.toObject();
        setCookie(c, "access_token", token, {
            maxAge: 30 * 60,
            httpOnly: true,
            sameSite: secureCookie ? "None" : "Lax",
            secure: secureCookie,
        });
        deleteCookie(c, "google_oauth_state", {
            sameSite: secureCookie ? "None" : "Lax",
            secure: secureCookie,
        });
        return c.redirect(
            `${clientUrl}/login?auth_token=${encodeURIComponent(token)}`,
        );
    } catch (error) {
        console.error("Google login failed:", error);
        return c.redirect(`${clientUrl}/login?error=google_auth_failed`);
    }
};

export const logout = async (c: Context) => {
    const token: string = getCookie(c, "access_token")!;

    // const user_data = await verify(token, process.env.JWT_SECRET!);

    // const user: IUserSchema | null = await User.findById(user_data.id);

    const deletedCookie = deleteCookie(c, "access_token", {
        sameSite: "none",
        secure: true,
    });

    return c.json({
        status: false,
        data: [deletedCookie],
        message: "You have been logged out successfully...",
    });
};

export const forgotPassword = async (c: Context) => {
    const { email }: IUserSchema = await c.req.json();

    try {
        if (!email) {
            return c.json(
                {
                    status: false,
                    error: c.res.status,
                    data: [],
                    message: "Email is required",
                },
                400
            );
        }

        const user: IUserSchema | null = await User.findOne({ email });

        if (!user) {
            return c.json(
                {
                    status: false,
                    error: c.res.status,
                    data: [],
                    message:
                        "Invalid email or password. Please try again with the correct credentials.",
                },
                401
            );
        }

        const token = crypto.randomBytes(20).toString("hex");
        user.resetPasswordToken = token;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

        await user.save();
        // Send Reset Password Email
        const response = await sendResetPasswordEmail(user.email, token);

        if (response) {
            return c.json({
                message: "Reset password email sent successfully!",
                resendResponse: response,
            });
        }
    } catch (error: any) {
        return c.json(
            {
                error: error.message || "Failed to send email",
            },
            500
        );
    }
};

export const resetPassword = async (c: Context) => {
    try {
        const token = c.req.param("token");
        const { password }: IUserSchema = await c.req.json();

        if (!token || !password) {
            return c.json(
                {
                    error: "Missing token or password",
                },
                400
            );
        }

        const user: IUserSchema | null = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() },
        });

        if (!user) {
            return c.json({ error: "Invalid or expired token" }, 400);
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const updatedUserPassword = await User.findOneAndUpdate(
            {
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() },
            },
            {
                $set: {
                    password: hash,
                    resetPasswordToken: null,
                    resetPasswordExpires: null,
                },
            },
            {
                new: true,
                save: true,
            }
        ).select("-__v");


        let newToken = await user.generateJWT();

        setCookie(c, "access_token", newToken, {
            maxAge: 30 * 60 * 1000, // would expire in 30 minutes
            httpOnly: true,
            sameSite: "Strict",
        });

        return c.json({
            status: true,
            message: "You have successfully reset user password!",
            data: [updatedUserPassword],
            newToken,
        });
    } catch (error: any) {
        return c.json(
            {
                error: error.message || "Failed to reset user password.",
            },
            500
        );
    }
};
