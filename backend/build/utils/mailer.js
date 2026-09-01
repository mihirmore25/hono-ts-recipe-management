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
exports.sendResetPasswordEmail = void 0;
const resend_1 = require("resend");
const sendResetPasswordEmail = (email, token) => __awaiter(void 0, void 0, void 0, function* () {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    if (!apiKey || !fromEmail) {
        throw new Error("Resend is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.");
    }
    const resend = new resend_1.Resend(apiKey);
    const frontendBaseUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const normalizedBaseUrl = frontendBaseUrl
        .replace(/\/+$/, "")
        .replace(/\/api(?:\/v1)?$/, "");
    const resetURL = `${normalizedBaseUrl}/reset-password/${token}`;
    const { data, error } = yield resend.emails.send({
        from: fromEmail,
        to: "mihirmore.25@gmail.com",
        subject: "Password Reset",
        text: `You are receiving this email because you (or someone else) have requested a reset of a password. Please click the following link to set a new password: ${resetURL}`,
    });
    if (error) {
        console.error("Resend email error:", error);
        throw new Error("Unable to send password reset email.");
    }
    return data;
});
exports.sendResetPasswordEmail = sendResetPasswordEmail;
