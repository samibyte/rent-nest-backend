import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import { IndexRoutes } from "./app/router/index.js";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler.js";
import { notFound } from "./app/middlewares/notFound.js";

import { paymentController } from "./app/modules/payment/payment.controller.js";

const app: Application = express();

app.use(
  cors({
    origin: ["http://localhost:5000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Register Stripe Webhook route requiring raw body before express.json()
app.post(
  "/api/v1/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentController.handleStripeWebhookEvent,
);

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", IndexRoutes);

// Basic route
app.get("/", async (req: Request, res: Response) => {
  res.status(201).json({
    success: true,
    message: "API is working",
  });
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
