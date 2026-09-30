import express from "express";
import { allSql, getSql } from "../config/db.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get(
  "/analytics",
  authenticate,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const sales = await allSql(`
      SELECT date(created_at) as day, SUM(total) as revenue
      FROM orders
      WHERE status != 'cancelled'
      GROUP BY date(created_at)
      ORDER BY day DESC
      LIMIT 30;
    `);

      const bestSelling = await allSql(`
      SELECT menu_name, SUM(quantity) as quantity
      FROM order_items
      GROUP BY menu_name
      ORDER BY quantity DESC
      LIMIT 5;
    `);

      const byMeal = await allSql(`
      SELECT m.category, SUM(oi.quantity * oi.unit_price) as revenue
      FROM order_items oi
      JOIN menu_items m ON m.id = oi.menu_item_id
      GROUP BY m.category;
    `);

      const totals = await getSql(
        `SELECT COUNT(*) as orders, SUM(total) as revenue FROM orders WHERE status != 'cancelled';`,
      );
      res.json({ sales, bestSelling, byMeal, totals });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/inventory",
  authenticate,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const inventory = await allSql(
        "SELECT * FROM menu_items ORDER BY stock_quantity ASC",
      );
      res.json(inventory);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/users",
  authenticate,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const users = await allSql(`
        SELECT u.id, u.name, u.email, u.role, u.loyalty_points, u.created_at,
               COUNT(o.id) as order_count,
               COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total ELSE 0 END), 0) as total_spent
        FROM users u
        LEFT JOIN orders o ON o.customer_id = u.id
        GROUP BY u.id
        ORDER BY u.created_at DESC
      `);
      res.json(users);
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  "/users/:id/role",
  authenticate,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const { role } = req.body;
      if (!["customer", "staff", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role specified." });
      }
      await runSql("UPDATE users SET role = ? WHERE id = ?", [role, req.params.id]);
      const updated = await getSql("SELECT id, name, email, role FROM users WHERE id = ?", [req.params.id]);
      res.json({ message: `Role updated to ${role}`, user: updated });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/orders",
  authenticate,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const orders = await allSql(`
        SELECT o.*, u.name as customer_name, u.email as customer_email
        FROM orders o
        JOIN users u ON u.id = o.customer_id
        ORDER BY o.created_at DESC
        LIMIT 100
      `);

      const enriched = await Promise.all(
        orders.map(async (order) => {
          const items = await allSql(
            "SELECT * FROM order_items WHERE order_id = ?",
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

router.get(
  "/audit-logs",
  authenticate,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const priceLogs = await allSql(`
        SELECT p.*, m.name as item_name, u.name as changed_by_name
        FROM price_change_history p
        JOIN menu_items m ON m.id = p.menu_item_id
        JOIN users u ON u.id = p.changed_by_user_id
        ORDER BY p.changed_at DESC
        LIMIT 50
      `);

      const auditLogs = await allSql(`
        SELECT a.*, u.name as actor_name
        FROM audit_logs a
        LEFT JOIN users u ON u.id = a.actor_id
        ORDER BY a.created_at DESC
        LIMIT 50
      `);

      res.json({ priceLogs, auditLogs });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
