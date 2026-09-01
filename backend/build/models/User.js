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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const jwt_1 = require("hono/jwt");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userSchema = new mongoose_1.Schema({
    username: {
        type: String,
        required: [true, "Your username is required"],
        max: 50,
    },
    email: {
        type: String,
        required: [true, "Your email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function (v) {
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: "Please enter a valid email",
        },
    },
    password: {
        type: String,
        required: function () {
            return this.authProvider !== "google";
        },
        select: false,
        max: 25,
    },
    googleId: { type: String, unique: true, sparse: true },
    authProvider: {
        type: String,
        enum: ["local", "google"],
        default: "local",
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    profileImage: {
        type: Object,
        default: {},
    },
    resetPasswordToken: {
        type: String,
        default: null,
    },
    resetPasswordExpires: {
        type: Date,
        default: null,
    },
}, { timestamps: true });
userSchema.methods.generateJWT = function () {
    return __awaiter(this, void 0, void 0, function* () {
        let payload = {
            id: this._id,
            exp: Math.floor(Date.now() / 1000) + 30 * 60,
        };
        return yield (0, jwt_1.sign)(payload, process.env.JWT_SECRET || "secret_mihir_jwt");
    });
};
userSchema.methods.isPasswordValid = function (password) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcryptjs_1.default.compare(password, this.password);
    });
};
userSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified("password"))
            return next(); // Skip if password is not modified
        try {
            const salt = yield bcryptjs_1.default.genSalt(10);
            this.password = yield bcryptjs_1.default.hash(this.password, salt);
            next();
        }
        catch (error) {
            console.error("Password hashing failed:", error);
            next(); // Pass error to Mongoose
        }
    });
});
exports.User = (0, mongoose_1.model)("user", userSchema);
