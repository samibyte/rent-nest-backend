import { randomUUID } from "crypto";
import httpStatus from "http-status";
import Stripe from "stripe";
import { prisma } from "../../lib/prisma.js";
import { stripe } from "../../config/stripe.config.js";
import { envVars } from "../../config/env.js";
import AppError from "../../errorHelpers/AppError.js";
import {
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  RentalStatus,
} from "../../../generated/prisma/enums.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import type {
  IConfirmPaymentPayload,
  ICreatePaymentPayload,
  IPaginationOptions,
} from "./payment.interface.js";

// Tenant: Initiate a payment session (creates checkout session URL)

const createPayment = async (
  tenantId: string,
  payload: ICreatePaymentPayload,
) => {
  const { rentalRequestId, successUrl, cancelUrl } = payload;

  // 1. Fetch rental — include property to derive amount
  const rental = await prisma.rentalRequest.findUnique({
    where: { id: rentalRequestId },
    include: { property: true },
  });

  if (!rental) {
    throw new AppError(httpStatus.NOT_FOUND, "Rental request not found");
  }

  // 2. Ownership check
  if (rental.tenantId !== tenantId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to pay for this rental request",
    );
  }

  // 3. Only APPROVED rentals may proceed to payment
  if (rental.status !== RentalStatus.APPROVED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot initiate payment. Rental status is "${rental.status}" — only APPROVED requests can be paid.`,
    );
  }

  // 4. Prevent duplicate payment
  const existing = await prisma.payment.findUnique({
    where: { rentalRequestId },
  });

  if (existing) {
    throw new AppError(
      httpStatus.CONFLICT,
      "A payment record already exists for this rental request",
    );
  }

  // 5. Create PENDING Payment in DB first with a temporary transaction ID
  const tempTxnId = `TEMP-${randomUUID().replace(/-/g, "").toUpperCase()}`;
  const payment = await prisma.payment.create({
    data: {
      transactionId: tempTxnId,
      amount: rental.property.monthlyRent,
      method: PaymentMethod.CARD,
      provider: PaymentProvider.STRIPE,
      status: PaymentStatus.PENDING,
      rentalRequestId,
      userId: tenantId,
    },
  });

  // 6. Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: rental.property.title,
            description: rental.property.description || undefined,
          },
          unit_amount: Math.round(rental.property.monthlyRent * 100), // convert to cents
        },
        quantity: 1,
      },
    ],
    metadata: {
      rentalRequestId: rental.id,
      paymentId: payment.id,
    },
    success_url:
      successUrl ||
      `${envVars.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${envVars.FRONTEND_URL}/payment/cancel`,
  });

  // 7. Update transactionId in our DB to match Stripe checkout session ID
  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      transactionId: session.id,
    },
    include: {
      rentalRequest: {
        include: {
          property: {
            select: { id: true, title: true, city: true, monthlyRent: true },
          },
        },
      },
    },
  });

  return {
    payment: updatedPayment,
    checkoutUrl: session.url,
  };
};

// Tenant/System: Confirm stripe payment manually (fallback)

const confirmPayment = async (
  tenantId: string,
  payload: IConfirmPaymentPayload,
) => {
  const { transactionId } = payload;

  const payment = await prisma.payment.findUnique({
    where: { transactionId },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment record not found");
  }

  // Ownership check
  if (payment.userId !== tenantId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to confirm this payment",
    );
  }

  // Guard: only PENDING payments can be confirmed
  if (payment.status !== PaymentStatus.PENDING) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Payment cannot be confirmed — current status is "${payment.status}"`,
    );
  }

  // Verify with Stripe before touching the DB
  const session = await stripe.checkout.sessions.retrieve(transactionId);
  if (session.payment_status !== "paid") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Stripe payment is not completed yet",
    );
  }

  // Wrap status check + update in a transaction to eliminate TOCTOU race.
  // The conditional update acts as an optimistic lock — if another request already
  // changed the status away from PENDING, the update returns 0 rows and we abort.
  const confirmed = await prisma.$transaction(async (tx) => {
    const updated = await tx.payment.updateMany({
      where: { id: payment.id, status: PaymentStatus.PENDING },
      data: {
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(),
        paymentGatewayData: session as any,
      },
    });

    if (updated.count === 0) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Payment was already processed by another request.",
      );
    }

    await tx.rentalRequest.update({
      where: { id: payment.rentalRequestId },
      data: { status: RentalStatus.ACTIVE },
    });

    return tx.payment.findUnique({
      where: { id: payment.id },
      include: {
        rentalRequest: {
          include: {
            property: {
              select: { id: true, title: true, city: true, monthlyRent: true },
            },
          },
        },
      },
    });
  });

  return confirmed;
};

// Webhook: Handle Stripe Event

const handlerStripeWebhookEvent = async (event: Stripe.Event) => {
  const existingPayment = await prisma.payment.findFirst({
    where: {
      stripeEventId: event.id,
    },
  });

  if (existingPayment) {
    console.log(`Event ${event.id} already processed. Skipping.`);
    return { message: `Event ${event.id} already processed. Skipping.` };
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const rentalRequestId = session.metadata?.rentalRequestId;
      const paymentId = session.metadata?.paymentId;

      if (!rentalRequestId || !paymentId) {
        console.error("Missing rentalRequestId or paymentId in session metadata");
        return {
          message: "Missing rentalRequestId or paymentId in session metadata",
        };
      }

      const rental = await prisma.rentalRequest.findUnique({
        where: { id: rentalRequestId },
      });

      if (!rental) {
        console.error(`Rental Request with ID ${rentalRequestId} not found`);
        return { message: `Rental Request with ID ${rentalRequestId} not found` };
      }

      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.rentalRequest.update({
          where: { id: rentalRequestId },
          data: { status: RentalStatus.ACTIVE },
        });

        await tx.payment.update({
          where: { id: paymentId },
          data: {
            stripeEventId: event.id,
            status:
              session.payment_status === "paid"
                ? PaymentStatus.COMPLETED
                : PaymentStatus.FAILED,
            paidAt: session.payment_status === "paid" ? new Date() : null,
            paymentGatewayData: session as any,
          },
        });
      });

      console.log(
        `Processed checkout.session.completed for rental ${rentalRequestId} and payment ${paymentId}`,
      );
      break;
    }
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.paymentId;

      if (paymentId) {
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.FAILED,
            stripeEventId: event.id, // Idempotency guard for retries
            paymentGatewayData: session as any,
          },
        });
        console.log(`Marked payment ${paymentId} as FAILED due to expired checkout session.`);
      }
      break;
    }
    case "payment_intent.payment_failed": {
      // PaymentIntent events don't carry our paymentId metadata (set on the
      // Checkout Session). No actionable update can be made here; the
      // checkout.session.expired event covers the user-facing failure case.
      console.log(`Received payment_intent.payment_failed (${event.id}) — no action taken.`);
      break;
    }
    default:
      console.log(`Unhandled stripe webhook event type: ${event.type}`);
  }

  return { message: `Webhook Event ${event.id} processed successfully` };
};

// Tenant: Get own payment history

const getMyPayments = async (
  tenantId: string,
  pagination: IPaginationOptions,
) => {
  const page = Number(pagination.page) || 1;
  const limit = Number(pagination.limit) || 10;
  const skip = (page - 1) * limit;

  const where = { userId: tenantId };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      include: {
        rentalRequest: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                city: true,
                monthlyRent: true,
                images: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.count({ where }),
  ]);

  return { payments, meta: { page, limit, total } };
};

// Tenant: Get single payment by ID

const getPaymentById = async (id: string, tenantId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      rentalRequest: {
        include: {
          property: {
            include: {
              category: true,
              landlord: {
                select: { id: true, name: true, email: true, phone: true },
              },
            },
          },
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
  }

  if (payment.userId !== tenantId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to view this payment",
    );
  }

  return payment;
};

export const paymentService = {
  createPayment,
  confirmPayment,
  handlerStripeWebhookEvent,
  getMyPayments,
  getPaymentById,
};
