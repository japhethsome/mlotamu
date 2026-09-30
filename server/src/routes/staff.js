import express from "express";
import { allSql, getSql } from "../config/db.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get(
  "/dashboard",
  authenticate,
  authorize("staff", "admin"),
  async (req, res, next) => {
    try {
      const recentOrders = await allSql(
        "SELECT * FROM orders ORDER BY created_at DESC LIMIT 8",
      );
      const lowStock = await allSql(
        "SELECT * FROM menu_items WHERE stock_quantity < 10 ORDER BY stock_quantity ASC",
      );
      const orderCounts = await allSql(
        "SELECT status, COUNT(*) as count FROM orders GROUP BY status",
      );
      res.json({ recentOrders, lowStock, orderCounts });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/audit",
  authenticate,
  authorize("staff", "admin"),
  async (req, res, next) => {
    try {
      const logs = await allSql(
        "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20",
      );
      res.json(logs);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/price-history/:id",
  authenticate,
  authorize("staff", "admin"),
  async (req, res, next) => {
    try {
      const logs = await allSql(
        `SELECT p.*, u.name as actor_name FROM price_change_history p JOIN users u ON u.id = p.changed_by_user_id WHERE p.menu_item_id = ? ORDER BY p.changed_at DESC;`,
        [req.params.id],
      );
      res.json(logs);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
