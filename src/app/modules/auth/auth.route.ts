import { Router } from "express";
import { userController } from "./auth.controller.js";

export const authRouter: Router = Router();

authRouter.post("/register", userController.registerUser);
authRouter.post("/login", userController.loginUser);
