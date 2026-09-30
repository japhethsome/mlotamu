import express from "express";
import { z } from "zod";
import { allSql, getSql, runSql } from "../config/db.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

function normalizeMenuItem(row) {
  return {
    ...row,
    dietaryTags: JSON.parse(row.dietary_tags || "[]"),
    allergens: JSON.parse(row.allergens || "[]"),
    servingHours: JSON.parse(row.serving_hours || "{}"),
    isAvailable: !!row.is_available,
  };
}

const menuItemSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  price: z.number().positive(),
  image: z.string().url().optional().or(z.literal("")),
  category: z.enum(["breakfast", "lunch", "dinner", "supper"]),
  dietaryTags: z.array(z.string()).default([]),
  allergens: z.array(z.string()).default([]),
  stockQuantity: z.number().int().min(0),
  isAvailable: z.boolean().default(true),
  servingHours: z
    .object({ start: z.string(), end: z.string() })
    .default({ start: "06:00", end: "21:00" }),
});

router.get("/", async (req, res, next) => {
  try {
    const { category, tag, q } = req.query;
    let sql = "SELECT * FROM menu_items WHERE 1 = 1";
    const params = [];

    if (category) {
      if (category === "dinner" || category === "supper") {
        sql += " AND (category = 'dinner' OR category = 'supper')";
      } else {
        sql += " AND category = ?";
        params.push(category);
      }
    }

    if (tag) {
      sql += " AND dietary_tags LIKE ?";
      params.push(`%"${tag}"%`);
    }

    if (q) {
      sql += " AND (name LIKE ? OR description LIKE ?)";
      params.push(`%${q}%`, `%${q}%`);
    }

    sql += " ORDER BY category, name";
    const rows = await allSql(sql, params);
    res.json(rows.map(normalizeMenuItem));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const row = await getSql("SELECT * FROM menu_items WHERE id = ?", [
      req.params.id,
    ]);
    if (!row) return res.status(404).json({ message: "Menu item not found." });
    res.json(normalizeMenuItem(row));
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  authenticate,
  authorize("staff", "admin"),
  validate(menuItemSchema),
  async (req, res, next) => {
    try {
      const payload = req.body;
      const item = await runSql(
        `INSERT INTO menu_items (name, description, price, image, category, dietary_tags, allergens, stock_quantity, is_available, serving_hours)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          payload.name,
          payload.description,
          Number(payload.price),
          payload.image || "",
          payload.category,
          JSON.stringify(payload.dietaryTags),
          JSON.stringify(payload.allergens),
          Number(payload.stockQuantity),
          payload.isAvailable ? 1 : 0,
          JSON.stringify(payload.servingHours),
        ],
      );

      const created = await getSql("SELECT * FROM menu_items WHERE id = ?", [
        item.id,
      ]);
      res.status(201).json(normalizeMenuItem(created));
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  "/:id/price",
  authenticate,
  authorize("staff", "admin"),
  async (req, res, next) => {
    try {
      const { newPrice, reason } = req.body;
      const parsed = Number(newPrice);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return res
          .status(400)
          .json({ message: "Price must be a positive number." });
      }

      const item = await getSql("SELECT * FROM menu_items WHERE id = ?", [
        req.params.id,
      ]);
      if (!item)
        return res.status(404).json({ message: "Menu item not found." });

      const previousPrice = Number(item.price);
      if (previousPrice === parsed) {
        return res
          .status(400)
          .json({ message: "New price matches the current price." });
      }

      await runSql(
        "UPDATE menu_items SET price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [parsed, req.params.id],
      );
      await runSql(
        "INSERT INTO price_change_history (menu_item_id, changed_by_user_id, old_price, new_price, reason) VALUES (?, ?, ?, ?, ?)",
        [
          req.params.id,
          req.user.id,
          previousPrice,
          parsed,
          reason || "Manual price change",
        ],
      );

      res.json({ message: "Price updated successfully." });
    } catch (error) {
      next(error);
    }
  },
);

router.put(
  "/:id",
  authenticate,
  authorize("staff", "admin"),
  validate(menuItemSchema),
  async (req, res, next) => {
    try {
      const payload = req.body;
      await runSql(
        `UPDATE menu_items SET name = ?, description = ?, price = ?, image = ?, category = ?, dietary_tags = ?, allergens = ?, stock_quantity = ?, is_available = ?, serving_hours = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;`,
        [
          payload.name,
          payload.description,
          Number(payload.price),
          payload.image || "",
          payload.category,
          JSON.stringify(payload.dietaryTags),
          JSON.stringify(payload.allergens),
          Number(payload.stockQuantity),
          payload.isAvailable ? 1 : 0,
          JSON.stringify(payload.servingHours),
          req.params.id,
        ],
      );

      const updated = await getSql("SELECT * FROM menu_items WHERE id = ?", [
        req.params.id,
      ]);
      res.json(normalizeMenuItem(updated));
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/category-toggle",
  authenticate,
  authorize("staff", "admin"),
  async (req, res, next) => {
    try {
      const { category, isAvailable } = req.body;
      if (!category) {
        return res.status(400).json({ message: "Category is required." });
      }

      const availableVal = isAvailable ? 1 : 0;
      let sql = "UPDATE menu_items SET is_available = ?, updated_at = CURRENT_TIMESTAMP WHERE category = ?";
      const params = [availableVal, category];

      if (category === "dinner" || category === "supper") {
        sql = "UPDATE menu_items SET is_available = ?, updated_at = CURRENT_TIMESTAMP WHERE category = 'dinner' OR category = 'supper'";
        params.pop();
      }

      await runSql(sql, params);
      res.json({
        message: `${category} category is now ${isAvailable ? "open" : "closed"}.`,
        category,
        isAvailable: !!isAvailable,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  "/:id/availability",
  authenticate,
  authorize("staff", "admin"),
  async (req, res, next) => {
    try {
      const { isAvailable } = req.body;
      await runSql(
        "UPDATE menu_items SET is_available = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [isAvailable ? 1 : 0, req.params.id],
      );
      const updated = await getSql("SELECT * FROM menu_items WHERE id = ?", [
        req.params.id,
      ]);
      res.json(normalizeMenuItem(updated));
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  "/:id/serving-hours",
  authenticate,
  authorize("staff", "admin"),
  async (req, res, next) => {
    try {
      const { start, end } = req.body;
      if (!start || !end) {
        return res.status(400).json({ message: "Start and end serving times are required." });
      }
      await runSql(
        "UPDATE menu_items SET serving_hours = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [JSON.stringify({ start, end }), req.params.id],
      );
      const updated = await getSql("SELECT * FROM menu_items WHERE id = ?", [
        req.params.id,
      ]);
      res.json(normalizeMenuItem(updated));
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  "/:id/stock",
  authenticate,
  authorize("staff", "admin"),
  async (req, res, next) => {
    try {
      const { stockQuantity } = req.body;
      const parsed = Number(stockQuantity);
      if (Number.isNaN(parsed) || parsed < 0) {
        return res.status(400).json({ message: "Stock quantity must be a non-negative number." });
      }
      await runSql(
        "UPDATE menu_items SET stock_quantity = ?, is_available = CASE WHEN ? > 0 THEN is_available ELSE 0 END, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [parsed, parsed, req.params.id],
      );
      const updated = await getSql("SELECT * FROM menu_items WHERE id = ?", [
        req.params.id,
      ]);
      res.json(normalizeMenuItem(updated));
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/:id",
  authenticate,
  authorize("staff", "admin"),
  async (req, res, next) => {
    try {
      await runSql("UPDATE menu_items SET is_available = 0 WHERE id = ?", [
        req.params.id,
      ]);
      res.json({ message: "Menu item marked unavailable." });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
