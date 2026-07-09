import { Router } from "express";
import { categoryController } from "./category.controller.js";

export const categoryRouter: Router = Router();

// GET /api/v1/categories
categoryRouter.get("/", categoryController.getAllCategories);
