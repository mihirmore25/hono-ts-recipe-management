import { Hono } from "hono";
import { forgotPassword, login, logout, register, resetPassword } from "../controllers/auth";
import { verify } from "../middleware/verify";
const authRoutes = new Hono();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/logout", verify, logout);
authRoutes.post("/forgotPassword", forgotPassword);
authRoutes.post("/resetPassword/:token", resetPassword);

export default authRoutes;
