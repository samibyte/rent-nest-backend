import { Router } from "express";
import { propertyController } from "./property.controller.js";

export const propertyRouter: Router = Router();

// GET /api/v1/properties   — Browse all available properties (public)
propertyRouter.get("/", propertyController.getAllProperties);

// GET /api/v1/properties/:id  — View property details (public)
propertyRouter.get("/:id", propertyController.getPropertyById);
