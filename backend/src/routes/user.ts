import { Hono } from "hono";
import { isAdmin } from "../middleware/isAdmin";
import { verify } from "../middleware/verify";
import { createUser, getUsers, getUser, deleteUser } from "../controllers/user";

const userRoutes = new Hono();

userRoutes.post("/createUser", verify, isAdmin, createUser);
userRoutes.get("/getUsers", verify, isAdmin, getUsers);
userRoutes.get("/getUser/:id", verify, isAdmin, getUser);
userRoutes.delete("/deleteUser/:id", verify, isAdmin, deleteUser);

export default userRoutes;
