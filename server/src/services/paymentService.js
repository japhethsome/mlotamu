import { env } from "../config/env.js";

function normalizeAmount(amount) {
  return Number(amount || 0);
}

export async function processPayment({
  amount,
  currency,
  paymentMethod,
  reference,
}) {
  const amountValue = normalizeAmount(amount);

  if (!env.mockPayment) {
    if (paymentMethod === "card") {
      // I/O placeholder for Stripe, no real gateway is configured in demo mode.
      return {
        success: true,
        provider: "stripe",
        status: "paid",
        reference,
        message: "Stripe payment processed",
      };
    }

    if (paymentMethod === "mobile_money") {
      return {
        success: true,
        provider: "flutterwave",
        status: "paid",
        reference,
        message: "Mobile money payment initiated",
      };
    }
  }

  if (paymentMethod === "pay_at_counter") {
    return {
      success: true,
      provider: "counter",
      status: "pending_counter",
      reference,
      message: "Order will be paid at counter",
    };
  }

  if (!paymentMethod || amountValue <= 0) {
    return {
      success: false,
      provider: "mock",
      status: "failed",
      message: "Invalid payment request or amount",
    };
  }

  return {
    success: true,
    provider: "mock",
    status: "paid",
    reference,
    message: `Mock ${currency || env.baseCurrency} payment approved`,
  };
}
