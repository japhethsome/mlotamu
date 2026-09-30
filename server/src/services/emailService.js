import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
});

export async function sendOrderConfirmation({
  email,
  orderNumber,
  qrCodeDataUrl,
  total,
  pickupTime,
}) {
  if (!email) return { sent: false, reason: "email missing" };

  const text = `Your cafeteria order ${orderNumber} is confirmed. Total: ${total}. Pickup by ${pickupTime}.`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "Cafeteria Orders <no-reply@example.com>",
      to: email,
      subject: `Order confirmation: ${orderNumber}`,
      text,
      html: `
        <h2>Order confirmed</h2>
        <p>Your order <strong>${orderNumber}</strong> has been confirmed.</p>
        <p>Total: <strong>${total}</strong></p>
        <p>Pickup time: <strong>${pickupTime}</strong></p>
        <img alt="Order QR" src="${qrCodeDataUrl}" style="max-width:180px;" />
      `,
    });

    return { sent: true };
  } catch (error) {
    return { sent: false, reason: error.message };
  }
}
