import jwt from "jsonwebtoken";
import { getSql } from "../config/db.js";
import { env } from "../config/env.js";

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required." });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({
          message: "You do not have permission to access this resource.",
        });
    }

    next();
  };
}

export async function attachCurrentUser(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return next();

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await getSql(
      "SELECT id, email, name, role, loyalty_points FROM users WHERE id = ?",
      [decoded.id],
    );
    req.user = user ? { ...user, role: user.role || "customer" } : decoded;
  } catch (error) {
    req.user = null;
  }

  next();
}
