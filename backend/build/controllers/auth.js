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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.logout = exports.login = exports.register = void 0;
const User_1 = require("../models/User");
const cookie_1 = require("hono/cookie");
const mailer_1 = require("../utils/mailer");
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const register = (c) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password } = yield c.req.json();
    if (!username || !email || !password) {
        return c.json({
            status: false,
            error: c.res.status,
            data: [],
            message: "Username, Email, Password are required",
        }, 400);
    }
    const newUser = new User_1.User({
        username,
        email,
        password,
    });
    const isUserExist = yield User_1.User.findOne({ email });
    if (isUserExist)
        return c.json({
            status: false,
            error: c.res.status,
            data: [],
            message: "It seems you already have an user, please try creating user with different email.",
        }, 400);
    const savedUser = yield newUser.save();
    return c.json({
        status: true,
        message: "Thank you for registering with us. Your account has been created successfully.",
        data: savedUser.toObject(),
    }, 201);
});
exports.register = register;
const login = (c) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = yield c.req.json();
    if (!email || !password) {
        return c.json({
            status: false,
            error: c.res.status,
            data: [],
            message: "Email, Password are required",
        }, 400);
    }
    const user = yield User_1.User.findOne({ email }).select("+password");
    if (!user) {
        return c.json({
            status: false,
            error: c.res.status,
            data: [],
            message: "Invalid email or password. Please try again with the correct credentials.",
        }, 401);
    }
    const isPasswordValid = yield user.isPasswordValid(password);
    if (!isPasswordValid) {
        return c.json({
            status: false,
            error: c.res.status,
            data: [],
            message: "Invalid email or password. Please try again with the correct credentials.",
        }, 401);
    }
    // const { password, ...user_data } = user;
    // let options = {
    //     expiresIn: 24 * 60 * 60 * 1000, // would expire in 1 day
    //     httpOnly: true, // The cookie is only accessible by the web server
    // };
    const token = yield user.generateJWT();
    const _a = user.toObject(), { password: _password } = _a, userData = __rest(_a, ["password"]);
    (0, cookie_1.setCookie)(c, "access_token", token, {
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
});
exports.login = login;
const logout = (c) => __awaiter(void 0, void 0, void 0, function* () {
    const token = (0, cookie_1.getCookie)(c, "access_token");
    // const user_data = await verify(token, process.env.JWT_SECRET!);
    // const user: IUserSchema | null = await User.findById(user_data.id);
    // console.log("Logout User --> ", user);
    const deletedCookie = (0, cookie_1.deleteCookie)(c, "access_token", {
        sameSite: "none",
        secure: true,
    });
    return c.json({
        status: false,
        data: [deletedCookie],
        message: "You have been logged out successfully...",
    });
});
exports.logout = logout;
const forgotPassword = (c) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = yield c.req.json();
    try {
        if (!email) {
            return c.json({
                status: false,
                error: c.res.status,
                data: [],
                message: "Email is required",
            }, 400);
        }
        const user = yield User_1.User.findOne({ email });
        if (!user) {
            return c.json({
                status: false,
                error: c.res.status,
                data: [],
                message: "Invalid email or password. Please try again with the correct credentials.",
            }, 401);
        }
        const token = crypto_1.default.randomBytes(20).toString("hex");
        user.resetPasswordToken = token;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
        yield user.save();
        console.log("After: ", user);
        // Send Reset Password Email
        const response = yield (0, mailer_1.sendResetPasswordEmail)(user.email, token);
        console.log("Response: ", response);
        if (response) {
            return c.json({
                message: "Reset password email sent successfully!",
                resendResponse: response,
            });
        }
    }
    catch (error) {
        return c.json({
            error: error.message || "Failed to send email",
        }, 500);
    }
});
exports.forgotPassword = forgotPassword;
const resetPassword = (c) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = c.req.param("token");
        const { password } = yield c.req.json();
        if (!token || !password) {
            return c.json({
                error: "Missing token or password",
            }, 400);
        }
        const user = yield User_1.User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() },
        });
        if (!user) {
            return c.json({ error: "Invalid or expired token" }, 400);
        }
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hash = yield bcryptjs_1.default.hash(password, salt);
        const updatedUserPassword = yield User_1.User.findOneAndUpdate({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        }, {
            $set: {
                password: hash,
                resetPasswordToken: null,
                resetPasswordExpires: null,
            },
        }, {
            new: true,
            save: true,
        }).select("-__v");
        console.log("updated user password after: ", updatedUserPassword);
        let newToken = yield user.generateJWT();
        (0, cookie_1.setCookie)(c, "access_token", newToken, {
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
    }
    catch (error) {
        return c.json({
            error: error.message || "Failed to reset user password.",
        }, 500);
    }
});
exports.resetPassword = resetPassword;
