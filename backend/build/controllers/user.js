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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.getUser = exports.getUsers = exports.createUser = void 0;
const User_1 = require("../models/User");
const mongoose_1 = require("mongoose");
const createUser = (c) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password, role } = yield c.req.json();
    if (!username || !email || !password) {
        return c.json({
            status: false,
            data: [],
            message: "Username, Email & Password, Role are required.",
        }, 400);
    }
    const newUser = new User_1.User({
        username,
        email,
        password,
        role,
    });
    const isUserExist = yield User_1.User.findOne({ email });
    if (isUserExist)
        return c.json({
            status: false,
            data: [],
            message: "It seems you already have an user, please try creating user with different email.",
        }, 400);
    const savedUser = yield newUser.save();
    return c.json({
        status: true,
        message: "Your user account has been created successfully.",
        data: savedUser.toObject(),
    }, 201);
});
exports.createUser = createUser;
const getUsers = (c) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield User_1.User.find({})
        .select("+password")
        .sort({ createdAt: -1 })
        .limit(50);
    if (users.length <= 0) {
        return c.json({
            status: false,
            data: [],
            message: "No Users found! Please try again or create new User.",
        }, 404);
    }
    return c.json({
        status: true,
        data: users,
        message: "Users found successfully.",
    }, 200);
});
exports.getUsers = getUsers;
const getUser = (c) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = c.req.param("id");
    if (!(0, mongoose_1.isValidObjectId)(userId)) {
        return c.json({
            status: false,
            message: "Please search user with valid user id.",
        }, 404);
    }
    const user = yield User_1.User.findById(userId);
    if (!user) {
        return c.json({
            status: false,
            message: `User did not found with ${userId} id`,
        }, 404);
    }
    return c.json({
        status: true,
        data: user,
    }, 200);
});
exports.getUser = getUser;
const deleteUser = (c) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = c.req.param("id");
    if (!(0, mongoose_1.isValidObjectId)(userId)) {
        return c.json({
            status: false,
            message: "Please search user with valid user id.",
        }, 400);
    }
    const user = yield User_1.User.findById(userId);
    if (!user) {
        return c.json({
            status: false,
            message: `User did not found with ${userId} id.`,
        }, 404);
    }
    const deletedUser = yield User_1.User.findByIdAndDelete(userId);
    return c.json({
        status: true,
        data: deletedUser,
        message: "User has been deleted successfully.",
    }, 200);
});
exports.deleteUser = deleteUser;
