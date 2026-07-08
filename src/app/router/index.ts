import { Router } from "express";
import { authRouter } from "../modules/auth/auth.route.js";

export const IndexRoutes: Router = Router();

IndexRoutes.use("/auth", authRouter);
