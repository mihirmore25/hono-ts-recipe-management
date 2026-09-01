import { Resend } from "resend";

export const sendResetPasswordEmail = async (email: string, token: string) => {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !fromEmail) {
        throw new Error(
            "Resend is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.",
        );
    }

    const resend = new Resend(apiKey);
    const frontendBaseUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const normalizedBaseUrl = frontendBaseUrl
        .replace(/\/+$/, "")
        .replace(/\/api(?:\/v1)?$/, "");
    const resetURL = `${normalizedBaseUrl}/reset-password/${token}`;

    const { data, error } = await resend.emails.send({
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
};
