import { DB_NAME } from "../constants/dbName";
import mongoose from "mongoose";

export const dbClient = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGO_URI}/${DB_NAME}`,
            {
                auth: {
                    username: process.env.USER,
                    password: process.env.PASSWORD,
                },
                authSource: process.env.AUTH_SOURCE,
                writeConcern: {
                    w: "majority",
                    // journal: true,
                    wtimeoutMS: 5000,
                },
                readConcernLevel: "local",
            }
        );

        console.log(
            `MONGODB CONNECTED! ON DB HOST: ${connectionInstance.connection.host} ON PORT: ${connectionInstance.connection.port}`
        );
    } catch (error) {
        console.error(`MONGODB CONNECTION ERROR: --> `, error);
        process.exit(1);
    }
};
