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
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify = void 0;
const User_1 = require("../models/User");
const cookie_1 = require("hono/cookie");
const jwt_1 = require("hono/jwt");
const verify = (c, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (0, cookie_1.getCookie)(c, "access_token") ||
            ((_a = c.req.header("Authorization")) === null || _a === void 0 ? void 0 : _a.replace(/^Bearer\s+/i, ""));
        if (!token) {
            return c.json({
                status: false,
                message: "Not authorize to access this route, Please try logging in first.",
            }, 401);
        }
        const user_data = yield (0, jwt_1.verify)(token, process.env.JWT_SECRET || "secret_mihir_jwt");
        if (!user_data)
            return c.json({
                status: false,
                message: "This session has expired. Please login",
            }, 401);
        const user = yield User_1.User.findById(user_data.id).select("-password");
        const data = __rest(user === null || user === void 0 ? void 0 : user.toObject(), []);
        c.set("user", data);
        yield next();
    }
    catch (error) {
        const err = error;
        if (err.name === "JwtTokenExpired") {
            return c.json({
                error: "Token expired, please login again!",
            }, 401);
        }
        return c.json({ error: "Invalid token" }, 401);
    }
});
exports.verify = verify;
