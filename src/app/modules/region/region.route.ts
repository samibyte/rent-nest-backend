import { Router } from "express";
import { regionController } from "./region.controller.js";

export const regionRouter: Router = Router();

// GET /api/v1/regions
regionRouter.get("/", regionController.getAllRegions);
