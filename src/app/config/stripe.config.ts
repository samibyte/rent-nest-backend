import Stripe from "stripe";
import { envVars } from "./env.js";

export const stripe = new Stripe(envVars.STRIPE.STRIPE_SECRET_KEY, {
  apiVersion: "2025-01-27.acacia" as any, // use newest stable or typecast
});
