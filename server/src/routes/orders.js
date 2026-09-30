import express from "express";
import { randomUUID } from "node:crypto";
import QRCode from "qrcode";
import { z } from "zod";
import { allSql, db, getSql, runSql } from "../config/db.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { emitOrderUpdate } from "../services/socket.js";
import { processPayment } from "../services/paymentService.js";
import { sendOrderConfirmation } from "../services/emailService.js";

const router = express.Router();

function isMealOpen(item, now = new Date()) {
  const servingHours = item.servingHours || {};
  if (!servingHours.start || !servingHours.end) return true;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMinute] = String(servingHours.start)
    .split(":")
    .map(Number);
  const [endHour, endMinute] = String(servingHours.end).split(":").map(Number);
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
}

function normalizeMenuItem(row) {
  return {
    ...row,
    dietaryTags: JSON.parse(row.dietary_tags || "[]"),
    allergens: JSON.parse(row.allergens || "[]"),
    servingHours: JSON.parse(row.serving_hours || "{}"),
    isAvailable: !!row.is_available,
  };
}

const checkoutSchema = z.object({
  items: z.array(
    z.object({
      id: z.number(),
      quantity: z.number().int().min(1),
      notes: z.string().optional(),
    }),
  ),
  paymentMethod: z.enum(["card", "mobile_money", "wallet", "pay_at_counter"]),
  tip: z.number().default(0),
  promoCode: z.string().optional(),
  pickupTime: z.string().optional(),
});

router.get("/my", authenticate, async (req, res, next) => {
  try {
    const rows = await allSql(
      `SELECT o.*, json_group_array(json_object('id', oi.id, 'menu_item_id', oi.menu_item_id, 'menu_name', oi.menu_name, 'quantity', oi.quantity, 'unit_price', oi.unit_price, 'notes', oi.notes)) as items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.customer_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.user.id],
    );

    const normalized = rows.map((row) => ({
      ...row,
      items: JSON.parse(row.items || "[]").filter(Boolean),
    }));
    res.json(normalized);
  } catch (error) {
    next(error);
  }
});

router.get(
  "/",
  authenticate,
  authorize("staff", "admin"),
  async (req, res, next) => {
    try {
      const rows = await allSql(
        `SELECT o.*, u.name AS customer_name, u.email AS customer_email
       FROM orders o
       JOIN users u ON u.id = o.customer_id
       ORDER BY o.created_at DESC`,
      );

      const enriched = await Promise.all(
        rows.map(async (order) => {
          // Join menu_items so each item carries its category for staff filtering
          const items = await allSql(
            `SELECT oi.*, mi.category AS item_category
             FROM order_items oi
             LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
             WHERE oi.order_id = ?`,
            [order.id],
          );
          return { ...order, items };
        }),
      );

      res.json(enriched);
    } catch (error) {
      next(error);
    }
  },
);

router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const order = await getSql("SELECT * FROM orders WHERE id = ?", [
      req.params.id,
    ]);
    if (!order) return res.status(404).json({ message: "Order not found." });

    if (req.user.role === "customer" && order.customer_id !== req.user.id) {
      return res.status(403).json({ message: "You cannot access this order." });
    }

    const items = await allSql("SELECT * FROM order_items WHERE order_id = ?", [
      order.id,
    ]);
    res.json({ ...order, items });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/checkout",
  authenticate,
  validate(checkoutSchema),
  async (req, res, next) => {
    try {
      const { items, paymentMethod, tip, promoCode, pickupTime } = req.body;
      if (!items.length)
        return res.status(400).json({ message: "Cart is empty." });

      const itemLookup = [];
      for (const item of items) {
        const row = await getSql("SELECT * FROM menu_items WHERE id = ?", [
          item.id,
        ]);
        if (!row)
          return res
            .status(404)
            .json({ message: `Menu item ${item.id} no longer exists.` });
        if (!row.is_available)
          return res.status(400).json({ message: `${row.name} is sold out.` });
        if (row.stock_quantity < item.quantity)
          return res
            .status(400)
            .json({ message: `${row.name} does not have enough stock.` });
        if (!isMealOpen(normalizeMenuItem(row))) {
          return res
            .status(400)
            .json({ message: `The ${row.category} menu is currently closed.` });
        }
        itemLookup.push({
          ...normalizeMenuItem(row),
          quantity: item.quantity,
          notes: item.notes || "",
        });
      }

      const subtotal = itemLookup.reduce(
        (sum, entry) => sum + Number(entry.price) * entry.quantity,
        0,
      );
      const taxRate = Number(process.env.TAX_RATE || 0.1);
      const tax = subtotal * taxRate;
      const discountValue = promoCode === "SAVE10" ? subtotal * 0.1 : 0;
      const total = subtotal + tax + Number(tip || 0) - discountValue;

      const paymentResult = await processPayment({
        amount: total,
        currency: process.env.BASE_CURRENCY || "USD",
        paymentMethod,
        reference: `ord-${Date.now()}`,
      });

      if (!paymentResult.success) {
        return res.status(402).json({
          message: "Payment failed. Please retry or choose another method.",
        });
      }

      const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;
      const token = randomUUID();
      const validUntil = new Date(
        Date.now() + 1000 * 60 * 60 * 24 * 7,
      ).toISOString();

      const orderInsert = await runSql(
        "INSERT INTO orders (order_number, customer_id, subtotal, tax, tip, total, payment_method, payment_status, pickup_time, qr_token, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          orderNumber,
          req.user.id,
          subtotal,
          tax,
          Number(tip || 0),
          total,
          paymentMethod,
          paymentResult.status,
          pickupTime || new Date(Date.now() + 15 * 60000).toISOString(),
          token,
          "received",
        ],
      );

      for (const entry of itemLookup) {
        await runSql(
          "INSERT INTO order_items (order_id, menu_item_id, menu_name, quantity, unit_price, notes) VALUES (?, ?, ?, ?, ?, ?)",
          [
            orderInsert.id,
            entry.id,
            entry.name,
            entry.quantity,
            entry.price,
            entry.notes,
          ],
        );
        await runSql(
          "UPDATE menu_items SET stock_quantity = stock_quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [entry.quantity, entry.id],
        );
      }

      await runSql(
        "INSERT INTO qr_tokens (token, order_id, valid_until, status) VALUES (?, ?, ?, ?)",
        [token, orderInsert.id, validUntil, "valid"],
      );
      await runSql(
        "INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)",
        [
          req.user.id,
          "order_received",
          `Your order ${orderNumber} has been received.`,
        ],
      );

      const order = await getSql("SELECT * FROM orders WHERE id = ?", [
        orderInsert.id,
      ]);
      const qrCodeDataUrl = await QRCode.toDataURL(token);
      const user = await getSql("SELECT email FROM users WHERE id = ?", [
        req.user.id,
      ]);

      await sendOrderConfirmation({
        email: user.email,
        orderNumber,
        qrCodeDataUrl,
        total: Number(total).toFixed(2),
        pickupTime: pickupTime || "15-20 minutes",
      });

      emitOrderUpdate({ ...order, qrCodeDataUrl, items: itemLookup });

      res.status(201).json({
        order: {
          ...order,
          qrToken: token,
          qrCodeDataUrl,
          items: itemLookup,
        },
        payment: paymentResult,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("staff", "admin"),
  async (req, res, next) => {
    try {
      const { status } = req.body;
      const allowed = [
        "received",
        "preparing",
        "ready",
        "collected",
        "cancelled",
      ];
      if (!allowed.includes(status))
        return res.status(400).json({ message: "Invalid status value." });

      const order = await getSql("SELECT * FROM orders WHERE id = ?", [
        req.params.id,
      ]);
      if (!order) return res.status(404).json({ message: "Order not found." });

      await runSql(
        "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [status, req.params.id],
      );
      emitOrderUpdate({ ...order, status });
      res.json({ message: "Order status updated." });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/:id/refund",
  authenticate,
  authorize("staff", "admin"),
  async (req, res, next) => {
    try {
      const { reason } = req.body;
      await runSql(
        "UPDATE orders SET status = ?, cancel_reason = ?, payment_status = ? WHERE id = ?",
        [
          "cancelled",
          reason || "No reason provided",
          "refunded",
          req.params.id,
        ],
      );
      res.json({ message: "Order refunded and cancelled." });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/verify-qr",
  authenticate,
  authorize("staff", "admin"),
  async (req, res, next) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res
          .status(400)
          .json({ message: "Verification token or reference code is required." });
      }

      const cleanToken = String(token).trim();

      let order = await getSql(
        `SELECT o.*, u.name AS customer_name, u.email AS customer_email
         FROM orders o
         JOIN users u ON u.id = o.customer_id
         WHERE o.qr_token = ? 
            OR o.order_number = ? 
            OR o.order_number LIKE ?
            OR o.id = ?`,
        [cleanToken, cleanToken, `%${cleanToken}%`, Number(cleanToken) || -1],
      );

      if (!order) {
        const qrRecord = await getSql(
          "SELECT * FROM qr_tokens WHERE token = ?",
          [cleanToken],
        );
        if (qrRecord) {
          order = await getSql(
            `SELECT o.*, u.name AS customer_name, u.email AS customer_email
             FROM orders o
             JOIN users u ON u.id = o.customer_id
             WHERE o.id = ?`,
            [qrRecord.order_id],
          );
        }
      }

      if (!order) {
        return res
          .status(400)
          .json({ message: "No active order found matching this code." });
      }

      const items = await allSql(
        "SELECT * FROM order_items WHERE order_id = ?",
        [order.id],
      );

      res.json({
        valid: order.status !== "cancelled",
        order: { ...order, items },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/collect",
  authenticate,
  authorize("staff", "admin"),
  async (req, res, next) => {
    try {
      const { token, orderId } = req.body;
      const cleanToken = token ? String(token).trim() : null;

      let targetOrder = null;
      if (orderId) {
        targetOrder = await getSql("SELECT * FROM orders WHERE id = ?", [orderId]);
      } else if (cleanToken) {
        targetOrder = await getSql(
          "SELECT * FROM orders WHERE qr_token = ? OR order_number = ? OR order_number LIKE ?",
          [cleanToken, cleanToken, `%${cleanToken}%`],
        );
        if (!targetOrder) {
          const qrRecord = await getSql(
            "SELECT * FROM qr_tokens WHERE token = ?",
            [cleanToken],
          );
          if (qrRecord) {
            targetOrder = await getSql("SELECT * FROM orders WHERE id = ?", [
              qrRecord.order_id,
            ]);
          }
        }
      }

      if (!targetOrder) {
        return res.status(400).json({ message: "Order not found." });
      }

      await runSql(
        "UPDATE qr_tokens SET status = 'used', used_at = CURRENT_TIMESTAMP WHERE order_id = ?",
        [targetOrder.id],
      );
      await runSql(
        "UPDATE orders SET status = 'collected', qr_used_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [targetOrder.id],
      );

      emitOrderUpdate({ ...targetOrder, status: "collected" });
      res.json({
        message: "Order marked as collected.",
        orderId: targetOrder.id,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
