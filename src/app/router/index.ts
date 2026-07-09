import { Router } from "express";
import { authRouter } from "../modules/auth/auth.route.js";
import { propertyRouter } from "../modules/property/property.route.js";
import { landlordPropertyRouter } from "../modules/property/landlordProperty.route.js";
import { categoryRouter } from "../modules/category/category.route.js";

export const IndexRoutes: Router = Router();

IndexRoutes.use("/auth", authRouter);
IndexRoutes.use("/properties", propertyRouter);
IndexRoutes.use("/landlord/properties", landlordPropertyRouter);
IndexRoutes.use("/categories", categoryRouter);
