import { Schema, model, Document, ObjectId } from "mongoose";
import { sign } from "hono/jwt";
import bcrypt from "bcryptjs";

interface IUserSchema extends Document {
    _id: ObjectId;
    username: string;
    email: string;
    password: string;
    googleId?: string;
    authProvider?: "local" | "google";
    role: string;
    profileImage?: {
        publicId?: string;
        imageUrl?: string;
    };
    resetPasswordToken: string;
    resetPasswordExpires: Date;
    generateJWT(): Promise<string>;
    isPasswordValid(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUserSchema>(
    {
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
                    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(
                        v
                    );
                },
                message: "Please enter a valid email",
            },
        },
        password: {
            type: String,
            required: function (this: IUserSchema) {
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
    },
    { timestamps: true }
);

userSchema.methods.generateJWT = async function (
    this: IUserSchema
): Promise<string> {
    let payload: { id: ObjectId; exp: number } = {
        id: this._id,
        exp: Math.floor(Date.now() / 1000) + 30 * 60,
    };

    return await sign(payload, process.env.JWT_SECRET || "secret_mihir_jwt");
};

userSchema.methods.isPasswordValid = async function (
    this: IUserSchema,
    password: string
): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
};

userSchema.pre("save", async function (next: () => void) {
    if (!this.isModified("password")) return next(); // Skip if password is not modified

    try {
        const salt: string = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        console.error("Password hashing failed:", error);
        next(); // Pass error to Mongoose
    }
});

export const User = model("user", userSchema);
export type { IUserSchema };
