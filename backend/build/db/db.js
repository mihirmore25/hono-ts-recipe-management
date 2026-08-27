"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbClient = void 0;
const dbName_1 = require("../constants/dbName");
const mongoose_1 = __importDefault(require("mongoose"));
const dbClient = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const connectionInstance = yield mongoose_1.default.connect(`${process.env.MONGO_URI}/${dbName_1.DB_NAME}`, {
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
        });
        console.log(`MONGODB CONNECTED! ON DB HOST: ${connectionInstance.connection.host} ON PORT: ${connectionInstance.connection.port}`);
    }
    catch (error) {
        console.error(`MONGODB CONNECTION ERROR: --> `, error);
        process.exit(1);
    }
});
exports.dbClient = dbClient;
