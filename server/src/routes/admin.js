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

export default router;
