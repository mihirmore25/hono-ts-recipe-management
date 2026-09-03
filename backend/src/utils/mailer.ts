import { Resend } from "resend";

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

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
    const safeResetURL = escapeHtml(resetURL);
    const foodIcons = "🍳  🥗  🍕  🥣  🧁  🥑  🍲  🍋  🥕";

    const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: "mihirmore.25@gmail.com",
        subject: "Reset your RecipeHub password",
        text: `You requested a RecipeHub password reset. Reset your password here: ${resetURL}\n\nThis link expires in 1 hour. If you did not request this, you can safely ignore this email.`,
        html: `
            <!doctype html>
            <html lang="en">
                <head>
                    <meta charset="utf-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>Reset your RecipeHub password</title>
                </head>
                <body style="margin:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
                    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
                        Reset your RecipeHub password securely. This link expires in 1 hour.
                    </div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8fafc;padding:32px 12px;">
                        <tr>
                            <td align="center">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background-color:#ffffff;border:1px solid #fde68a;border-radius:24px;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,42,0.08);">
                                    <tr>
                                        <td style="background-color:#f59e0b;padding:18px 24px;text-align:center;font-size:24px;letter-spacing:10px;line-height:1.8;">
                                            ${foodIcons}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding:36px 32px 12px;text-align:center;">
                                            <div style="display:inline-block;background-color:#fef3c7;border-radius:999px;padding:8px 14px;color:#b45309;font-size:13px;font-weight:700;letter-spacing:1px;">
                                                RECIPEHUB SECURITY
                                            </div>
                                            <h1 style="margin:22px 0 12px;font-size:30px;line-height:1.2;color:#0f172a;">
                                                Reset your password
                                            </h1>
                                            <p style="margin:0;color:#475569;font-size:16px;line-height:1.7;">
                                                We received a request to reset your RecipeHub password. Use the button below to create a new one.
                                            </p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" style="padding:24px 32px 16px;">
                                            <a href="${safeResetURL}" style="display:inline-block;background-color:#f59e0b;border-radius:999px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:15px 28px;">
                                                Reset password
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding:8px 32px 28px;text-align:center;">
                                            <p style="margin:0;color:#64748b;font-size:13px;line-height:1.7;">
                                                This secure link expires in <strong>1 hour</strong>.
                                            </p>
                                            <p style="margin:18px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">
                                                If the button does not work, copy and paste this link into your browser:<br />
                                                <a href="${safeResetURL}" style="color:#b45309;word-break:break-all;">${safeResetURL}</a>
                                            </p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="background-color:#fffbeb;border-top:1px solid #fef3c7;padding:20px 24px;text-align:center;">
                                            <div style="font-size:20px;letter-spacing:8px;line-height:1.7;">${foodIcons}</div>
                                            <p style="margin:10px 0 0;color:#92400e;font-size:13px;font-weight:700;">
                                                Cook, create, and share with RecipeHub.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                                <p style="margin:18px 0 0;color:#94a3b8;font-size:12px;">
                                    If you did not request a password reset, you can safely ignore this email.
                                </p>
                            </td>
                        </tr>
                    </table>
                </body>
            </html>
        `,
    });

    if (error) {
        console.error("Resend email error:", error);
        throw new Error("Unable to send password reset email.");
    }

    return data;
};
