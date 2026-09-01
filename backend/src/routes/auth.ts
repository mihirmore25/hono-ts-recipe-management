import { Hono } from "hono";
import { forgotPassword, googleCallback, googleLogin, login, logout, register, resetPassword } from "../controllers/auth";
import { verify } from "../middleware/verify";
const authRoutes = new Hono();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.get("/google", googleLogin);
authRoutes.get("/google/callback", googleCallback);
authRoutes.post("/logout", verify, logout);
authRoutes.post("/forgotPassword", forgotPassword);
authRoutes.post("/resetPassword/:token", resetPassword);

export default authRoutes;
