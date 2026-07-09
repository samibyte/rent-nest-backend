import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { paymentService } from "./payment.service.js";
import { stripe } from "../../config/stripe.config.js";
import { envVars } from "../../config/env.js";

// Tenant: Initiate a payment

const createPayment = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.id;
  const result = await paymentService.createPayment(tenantId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Stripe checkout session created successfully. Use the checkoutUrl to complete payment.",
    data: result,
  });
});

// Tenant: Confirm payment (manual verify check fallback)

const confirmPayment = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.id;
  const payment = await paymentService.confirmPayment(tenantId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment verified and completed. Rental request is now ACTIVE.",
    data: payment,
  });
});

// Stripe: Event Webhook Handler

const handleStripeWebhookEvent = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;
  const webhookSecret = envVars.STRIPE.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.error("Missing Stripe signature or webhook secret");
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Missing Stripe signature or webhook secret",
    });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (error: any) {
    console.error("Error processing Stripe webhook event construction:", error.message);
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: `Error processing Stripe webhook: ${error.message}`,
    });
  }

  try {
    const result = await paymentService.handlerStripeWebhookEvent(event);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Stripe webhook event processed successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Error handling Stripe webhook event logic:", error);
    sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: `Error handling Stripe webhook event: ${error.message}`,
      data: null,
    });
  }
});

// Tenant: Get payment history

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.id;
  const { page, limit } = req.query;

  const result = await paymentService.getMyPayments(tenantId, {
    page: Number(page) || 1,
    limit: Number(limit) || 10,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment history fetched successfully",
    data: result.payments,
    meta: result.meta,
  });
});

// Tenant: Get single payment

const getPaymentById = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.id;
  const payment = await paymentService.getPaymentById(
    req.params.id as string,
    tenantId,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment fetched successfully",
    data: payment,
  });
});

export const paymentController = {
  createPayment,
  confirmPayment,
  handleStripeWebhookEvent,
  getMyPayments,
  getPaymentById,
};
