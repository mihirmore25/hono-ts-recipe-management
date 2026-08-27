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
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
const sendResetPasswordEmail = (email, token) => __awaiter(void 0, void 0, void 0, function* () {
    const frontendBaseUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const normalizedBaseUrl = frontendBaseUrl
        .replace(/\/+$/, "")
        .replace(/\/api(?:\/v1)?$/, "");
    const resetURL = `${normalizedBaseUrl}/reset-password/${token}`;
    const mailOptions = {
        from: process.env.RESEND_FROM_EMAIL,
        to: "mihirmore.25@gmail.com",
        subject: "Password Reset",
        text: `You are receiving this email because you (or someone else) have requested the reset of a password. Please click the following link to set a new password: ${resetURL}`,
    };
    const response = yield resend.emails.send(mailOptions);
    console.log("Email sent: ", response);
    return response;
});
exports.sendResetPasswordEmail = sendResetPasswordEmail;
