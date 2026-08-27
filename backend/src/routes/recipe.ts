import { Hono } from "hono";
import { verify } from "../middleware/verify";
import {
    createRecipe,
    deleteRecipe,
    updateRecipe,
    getRecipe,
    getRecipes,
    getUserRecipes,
    likeRecipe
} from "../controllers/recipe";
const recipeRoutes = new Hono();

recipeRoutes.post("/", verify, createRecipe);
recipeRoutes.get("/", verify, getRecipes);
recipeRoutes.get("/user/:id", verify, getUserRecipes);
recipeRoutes.get("/:id", verify, getRecipe);
recipeRoutes.delete("/:id", verify, deleteRecipe);
recipeRoutes.put("/:id", verify, updateRecipe);
recipeRoutes.post("/:id/like", verify, likeRecipe);

export default recipeRoutes;
