import { Router } from "express";
import { authRouter } from "../modules/auth/auth.route.js";
import { propertyRouter } from "../modules/property/property.route.js";
import { landlordPropertyRouter } from "../modules/property/landlordProperty.route.js";
import { categoryRouter } from "../modules/category/category.route.js";
import { rentalRouter } from "../modules/rental/rental.route.js";
import { landlordRentalRouter } from "../modules/rental/landlordRental.route.js";
import { paymentRouter } from "../modules/payment/payment.route.js";
import { reviewRouter } from "../modules/review/review.route.js";
import { adminRouter } from "../modules/admin/admin.route.js";

export const IndexRoutes: Router = Router();

IndexRoutes.use("/auth", authRouter);
IndexRoutes.use("/properties", propertyRouter);
IndexRoutes.use("/categories", categoryRouter);
IndexRoutes.use("/rentals", rentalRouter);
IndexRoutes.use("/payments", paymentRouter);
IndexRoutes.use("/reviews", reviewRouter);
IndexRoutes.use("/admin", adminRouter);
IndexRoutes.use("/landlord/properties", landlordPropertyRouter);
IndexRoutes.use("/landlord/requests", landlordRentalRouter);


