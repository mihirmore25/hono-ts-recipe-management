import { Hono } from "hono";
import { verify } from "../middleware/verify";
import {
    createRecipe,
    deleteRecipe,
    updateRecipe,
    getRecipe,
    getRecipes,
    getUserRecipes,
    likeRecipe,
    bulkCreateRecipes,
} from "../controllers/recipe";
import { isAdmin } from "../middleware/isAdmin";
const recipeRoutes = new Hono();

recipeRoutes.post("/", verify, createRecipe);
recipeRoutes.post("/bulk", verify, isAdmin, bulkCreateRecipes);
recipeRoutes.get("/", verify, getRecipes);
recipeRoutes.get("/user/:id", verify, getUserRecipes);
recipeRoutes.get("/:id", verify, getRecipe);
recipeRoutes.delete("/:id", verify, deleteRecipe);
recipeRoutes.put("/:id", verify, updateRecipe);
recipeRoutes.post("/:id/like", verify, likeRecipe);

export default recipeRoutes;
