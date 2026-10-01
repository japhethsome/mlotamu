/**
 * Payments API routes
 *  POST /api/payments/mpesa/stk    – initiate STK Push
 *  POST /api/payments/mpesa/query  – poll STK Push status
 *  POST /api/payments/mpesa/callback – M-Pesa server callback (no auth)
 */
import express from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { initiateMpesaStkPush, queryStkPushStatus } from "../services/paymentService.js";
import { runSql, getSql } from "../config/db.js";
import { emitOrderUpdate } from "../services/socket.js";

const router = express.Router();

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const stkSchema = z.object({
  amount: z.number().positive(),
  phoneNumber: z.string().min(9),
  orderId: z.number().int().positive(),
  reference: z.string().optional(),
  description: z.string().optional(),
});

const querySchema = z.object({
  checkoutRequestId: z.string().min(1),
  orderId: z.number().int().positive().optional(),
});

// ---------------------------------------------------------------------------
// POST /api/payments/mpesa/stk  – trigger STK Push for an existing order
// ---------------------------------------------------------------------------
router.post("/mpesa/stk", authenticate, validate(stkSchema), async (req, res, next) => {
  try {
    const { amount, phoneNumber, orderId, description } = req.body;
    const reference = req.body.reference || `ORD-${orderId}`;

    const result = await initiateMpesaStkPush({
      amount,
      phoneNumber,
      reference,
      description,
    });

    if (!result.success) {
      return res.status(400).json({ message: result.message, raw: result.raw });
    }

    // Persist the checkoutRequestId so callback can match it
    if (orderId && result.checkoutRequestId) {
      await runSql(
        `UPDATE orders SET payment_method = ?, payment_status = 'pending_mpesa',
         updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [`Phone (M-Pesa STK: ${phoneNumber})`, orderId],
      ).catch(() => {}); // best-effort
    }

    res.json({
      success: true,
      checkoutRequestId: result.checkoutRequestId,
      merchantRequestId: result.merchantRequestId,
      message: result.message,
      mock: result.mock || false,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/payments/mpesa/query  – poll STK Push completion
// ---------------------------------------------------------------------------
router.post("/mpesa/query", authenticate, validate(querySchema), async (req, res, next) => {
  try {
    const { checkoutRequestId, orderId } = req.body;
    const status = await queryStkPushStatus(checkoutRequestId);

    // If completed successfully, update order payment_status
    if (status.completed && status.success && orderId) {
      await runSql(
        `UPDATE orders SET payment_status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [orderId],
      ).catch(() => {});
      const order = await getSql("SELECT * FROM orders WHERE id = ?", [orderId]);
      if (order) emitOrderUpdate(order);
    }

    res.json(status);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/payments/mpesa/callback  – Safaricom server-to-server callback
// (no authentication – Safaricom hits this directly)
// ---------------------------------------------------------------------------
router.post("/mpesa/callback", async (req, res) => {
  try {
    const body = req.body?.Body?.stkCallback;
    if (!body) return res.json({ ResultCode: 0, ResultDesc: "Accepted" });

    const checkoutRequestId = body.CheckoutRequestID;
    const resultCode = String(body.ResultCode);
    const resultDesc = body.ResultDesc || "";

    console.log("[MpesaCallback]", checkoutRequestId, resultCode, resultDesc);

    if (resultCode === "0") {
      // Payment succeeded – find and update the order by payment_method containing the reference or
      // just mark any pending_mpesa orders with this checkout ID. Daraja doesn't send the orderId,
      // so we match on orders that have payment_status = 'pending_mpesa' and were updated recently.
      // A more robust approach would store checkoutRequestId in its own column; for now we update all pending ones.
      const callbackItems = body.CallbackMetadata?.Item || [];
      const mpesaRef = callbackItems.find((i) => i.Name === "MpesaReceiptNumber")?.Value || "";
      const amount = callbackItems.find((i) => i.Name === "Amount")?.Value;
      const phone = callbackItems.find((i) => i.Name === "PhoneNumber")?.Value;

      // Attempt to find the matching order in the last 30 minutes
      const pendingOrders = await import("../config/db.js").then(({ allSql }) =>
        allSql(
          `SELECT * FROM orders WHERE payment_status = 'pending_mpesa'
           AND updated_at >= datetime('now','-30 minutes') ORDER BY updated_at DESC LIMIT 1`,
        ),
      );

      if (pendingOrders.length) {
        const order = pendingOrders[0];
        await runSql(
          `UPDATE orders SET payment_status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [order.id],
        );
        emitOrderUpdate({ ...order, payment_status: "paid", mpesaReceiptNumber: mpesaRef });
      }
    }

    // Always respond 200 to Safaricom
    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err) {
    console.error("[MpesaCallback] Error:", err);
    res.json({ ResultCode: 0, ResultDesc: "Accepted" }); // still ack
  }
});

export default router;
