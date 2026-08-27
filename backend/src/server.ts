import { Hono } from "hono";
import { cors } from "hono/cors";
import { dbClient } from "./db/db";
import { poweredBy } from "hono/powered-by";
import { logger } from "hono/logger";
import authRoutes from "./routes/auth";
import recipeRoutes from "./routes/recipe";
import { cloudinaryMiddleware } from "./middleware/cloudinary";
import userRoutes from "./routes/user";

const app = new Hono();
const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    process.env.CLIENT_URL,
].filter((origin): origin is string => Boolean(origin));

app.use(logger());
app.use(poweredBy({ serverName: "Recipe Management REST API with Hono" }));
app.use(cloudinaryMiddleware);
app.use(
    "*",
    cors({
        origin: allowedOrigins,
        allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    }),
);
app.options("*", (c) => {
    c.status(204);
    return c.text("");
});

// Routes
app.route("/api/v1/auth", authRoutes);
app.route("/api/v1/recipes", recipeRoutes);
app.route("/api/v1/admin/users", userRoutes);

dbClient()
    .then()
    .catch((err) => {
        app.get("/*", (c) => {
            return c.json(`Failed to connect mongodb: ${err.message}`);
        });
    });

app.onError((err, c) => {
    return c.text(`App Error: ${err.message}`);
});

app.get("/", (c) => c.text("Hello, Hono with typescript!"));

// Catch-all for unknown routes — return 404
app.all("*", (c) => {
    return c.json({ message: "Not Found" }, 404);
});

export default app;
