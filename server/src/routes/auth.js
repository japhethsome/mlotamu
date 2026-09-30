import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db, getSql, runSql } from "../config/db.js";
import { env } from "../config/env.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

function signTokens(user) {
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    env.jwtSecret,
    { expiresIn: "1h" },
  );
  const refreshToken = jwt.sign(
    { id: user.id, email: user.email },
    env.jwtRefreshSecret,
    { expiresIn: "7d" },
  );
  return { token, refreshToken };
}

async function stripUser(user) {
  if (!user) return null;
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

router.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existing = await getSql("SELECT id FROM users WHERE email = ?", [
      email.toLowerCase(),
    ]);
    if (existing)
      return res
        .status(409)
        .json({ message: "An account already exists for this email." });

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await runSql(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [name, email.toLowerCase(), passwordHash, "customer"],
    );
    const newUser = await getSql(
      "SELECT id, name, email, role, loyalty_points, created_at FROM users WHERE id = ?",
      [result.id],
    );
    const tokens = signTokens(newUser);

    res.status(201).json({ user: newUser, ...tokens });
  } catch (error) {
    next(error);
  }
});

router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await getSql("SELECT * FROM users WHERE email = ?", [
      email.toLowerCase(),
    ]);
    if (!user) return res.status(401).json({ message: "Invalid credentials." });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ message: "Invalid credentials." });

    const safeUser = await stripUser(user);
    const tokens = signTokens(safeUser);
    res.json({ user: safeUser, ...tokens });
  } catch (error) {
    next(error);
  }
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ message: "Refresh token is required." });

  try {
    const payload = jwt.verify(refreshToken, env.jwtRefreshSecret);
    const user = await getSql(
      "SELECT id, name, email, role, loyalty_points FROM users WHERE id = ?",
      [payload.id],
    );
    if (!user) return res.status(401).json({ message: "User not found." });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      env.jwtSecret,
      { expiresIn: "1h" },
    );
    res.json({ token });
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Refresh token expired or invalid." });
  }
});

router.get("/me", async (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer "))
    return res.status(401).json({ message: "Authentication required." });

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await getSql(
      "SELECT id, name, email, role, loyalty_points, created_at FROM users WHERE id = ?",
      [decoded.id],
    );
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ user });
  } catch (error) {
    return res.status(401).json({ message: "Invalid token." });
  }
});

router.post("/forgot-password", validate(forgotSchema), async (req, res) => {
  const { email } = req.body;
  const user = await getSql("SELECT id FROM users WHERE email = ?", [
    email.toLowerCase(),
  ]);
  if (!user) {
    return res.json({
      message: "If that email is registered, a reset link has been sent.",
    });
  }

  const resetToken = jwt.sign({ email: email.toLowerCase() }, env.jwtSecret, {
    expiresIn: "30m",
  });
  res.json({
    message: "If that email is registered, a reset link has been sent.",
    resetToken,
  });
});

router.get("/health", (_, res) => res.json({ ok: true }));

export default router;
