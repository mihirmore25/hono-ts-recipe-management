import { serve } from "@hono/node-server";
import app from "./server";
const PORT = process.env.PORT;

serve(
    {
        fetch: app.fetch,
        port: parseInt(PORT!),
    },
    (info) => {
        console.log(`Server is running on http://localhost:${info.port}`);
    }
);
