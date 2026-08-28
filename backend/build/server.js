"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const cors_1 = require("hono/cors");
const db_1 = require("./db/db");
const powered_by_1 = require("hono/powered-by");
const logger_1 = require("hono/logger");
const auth_1 = __importDefault(require("./routes/auth"));
const recipe_1 = __importDefault(require("./routes/recipe"));
const cloudinary_1 = require("./middleware/cloudinary");
const user_1 = __importDefault(require("./routes/user"));
const app = new hono_1.Hono();
const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    process.env.CLIENT_URL,
].filter((origin) => Boolean(origin));
app.use((0, logger_1.logger)());
app.use((0, powered_by_1.poweredBy)({ serverName: "Recipe Management REST API with Hono" }));
app.use(cloudinary_1.cloudinaryMiddleware);
app.use("*", (0, cors_1.cors)({
    origin: allowedOrigins,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
app.options("*", (c) => {
    c.status(204);
    return c.text("");
});
// Routes
app.route("/api/v1/auth", auth_1.default);
app.route("/api/v1/recipes", recipe_1.default);
app.route("/api/v1/users", user_1.default);
app.route("/api/v1/admin/users", user_1.default);
(0, db_1.dbClient)()
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
exports.default = app;
