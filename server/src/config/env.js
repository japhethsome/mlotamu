import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultDbPath = process.env.VERCEL
  ? path.join("/tmp", "cafeteria.db")
  : path.resolve(__dirname, "../../data/cafeteria.db");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export const env = {
  port: Number(process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "dev-jwt-secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
  dbPath: process.env.DB_PATH || defaultDbPath,
  baseCurrency: process.env.BASE_CURRENCY || "KES",
  taxRate: Number(process.env.TAX_RATE || 0.1),
  preferredTimezone: process.env.PREFERRED_TIMEZONE || "UTC",
  mockPayment: process.env.MOCK_PAYMENT !== "false",
  appName: process.env.APP_NAME || "Cafeteria Orders",
  // M-Pesa Daraja API
  mpesaConsumerKey: process.env.MPESA_CONSUMER_KEY || "",
  mpesaConsumerSecret: process.env.MPESA_CONSUMER_SECRET || "",
  mpesaShortcode: process.env.MPESA_SHORTCODE || "174379",
  mpesaPasskey:
    process.env.MPESA_PASSKEY ||
    "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
  mpesaCallbackUrl:
    process.env.MPESA_CALLBACK_URL ||
    "https://your-backend.onrender.com/api/payments/mpesa/callback",
  mpesaEnv: process.env.MPESA_ENV || "sandbox",
};
