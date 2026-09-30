import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import { db, runSql } from "../config/db.js";
import { seedDatabase } from "../services/seed.js";
import { initializeDatabase } from "../config/db.js";

beforeAll(async () => {
  await initializeDatabase();
  await runSql("DELETE FROM price_change_history");
  await runSql("DELETE FROM notifications");
  await runSql("DELETE FROM qr_tokens");
  await runSql("DELETE FROM order_items");
  await runSql("DELETE FROM orders");
  await runSql("DELETE FROM menu_items");
  await runSql("DELETE FROM promos");
  await runSql("DELETE FROM users");
  await runSql(
    "DELETE FROM sqlite_sequence WHERE name IN ('users', 'menu_items', 'orders', 'order_items', 'price_change_history', 'notifications', 'audit_logs', 'qr_tokens', 'promos')",
  );
  await seedDatabase();
});

beforeEach(async () => {
  await runSql(
    "UPDATE menu_items SET serving_hours = ?, stock_quantity = 50 WHERE id = 1",
    [JSON.stringify({ start: "00:00", end: "23:59" })],
  );
});

describe("Cafeteria API", () => {
  it("registers and logs in a new customer", async () => {
    const email = `customer_${Date.now()}@example.com`;
    const register = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test Customer", email, password: "Password123!" });

    expect(register.status).toBe(201);
    expect(register.body.user.email).toBe(email.toLowerCase());

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "Password123!" });

    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe("customer");
    expect(login.body.token).toBeTruthy();
  });

  it("creates an order and validates the QR token", async () => {
    const customerLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "customer@example.com", password: "Password123!" });

    const checkout = await request(app)
      .post("/api/orders/checkout")
      .set("Authorization", `Bearer ${customerLogin.body.token}`)
      .send({
        items: [{ id: 1, quantity: 2, notes: "Extra napkins" }],
        paymentMethod: "card",
        tip: 1.5,
      });

    expect(checkout.status).toBe(201);
    expect(checkout.body.order.total).toBeGreaterThan(0);

    const staffLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "staff@example.com", password: "Password123!" });

    const verify = await request(app)
      .post("/api/orders/verify-qr")
      .set("Authorization", `Bearer ${staffLogin.body.token}`)
      .send({ token: "invalid-qr-token" });

    expect(verify.status).toBe(400);
  });

  it("updates menu price as staff and records the change", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "staff@example.com", password: "Password123!" });

    const before = await request(app)
      .get("/api/menu")
      .set("Authorization", `Bearer ${login.body.token}`);

    const currentPrice = Number(before.body[0].price);
    const nextPrice = Number((currentPrice + 1.25).toFixed(2));

    const update = await request(app)
      .patch(`/api/menu/${before.body[0].id}/price`)
      .set("Authorization", `Bearer ${login.body.token}`)
      .send({ newPrice: nextPrice, reason: "Menu refresh" });

    expect(update.status).toBe(200);
    expect(update.body.message).toMatch(/updated/i);

    const history = await request(app)
      .get(`/api/staff/price-history/${before.body[0].id}`)
      .set("Authorization", `Bearer ${login.body.token}`);

    expect(history.status).toBe(200);
    expect(history.body.length).toBeGreaterThan(0);
  });
});
