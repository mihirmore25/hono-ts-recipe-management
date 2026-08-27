import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendResetPasswordEmail = async (email: string, token: string) => {
    const frontendBaseUrl =
        process.env.CLIENT_URL || "http://localhost:5173";
    const normalizedBaseUrl = frontendBaseUrl
        .replace(/\/+$/, "")
        .replace(/\/api(?:\/v1)?$/, "");
    const resetURL = `${normalizedBaseUrl}/reset-password/${token}`;

    const mailOptions = {
        from: process.env.RESEND_FROM_EMAIL!,
        to: "mihirmore.25@gmail.com",
        subject: "Password Reset",
        text: `You are receiving this email because you (or someone else) have requested the reset of a password. Please click the following link to set a new password: ${resetURL}`,
    };

    const response = await resend.emails.send(mailOptions);

    console.log("Email sent: ", response);

    return response;
};
