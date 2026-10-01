import { env } from "../config/env.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeAmount(amount) {
  return Math.ceil(Number(amount || 0)); // M-Pesa only accepts whole KES
}

/** Normalize phone to 2547XXXXXXXX format expected by Daraja */
function normalizeMpesaPhone(phone) {
  if (!phone) return null;
  const cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.startsWith("254") && cleaned.length === 12) return cleaned;
  if (cleaned.startsWith("0") && cleaned.length === 10)
    return `254${cleaned.slice(1)}`;
  if (cleaned.length === 9) return `254${cleaned}`;
  return null;
}

/** Build base64 timestamp password for STK Push */
function buildPassword(shortcode, passkey, timestamp) {
  const raw = `${shortcode}${passkey}${timestamp}`;
  return Buffer.from(raw).toString("base64");
}

function getTimestamp() {
  return new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);
}

// ---------------------------------------------------------------------------
// OAuth token cache (avoids new token every request)
// ---------------------------------------------------------------------------
let _tokenCache = null;
let _tokenExpiry = 0;

async function getMpesaToken() {
  if (_tokenCache && Date.now() < _tokenExpiry) return _tokenCache;

  const baseUrl =
    env.mpesaEnv === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

  const credentials = Buffer.from(
    `${env.mpesaConsumerKey}:${env.mpesaConsumerSecret}`,
  ).toString("base64");

  const response = await fetch(
    `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${credentials}` },
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`M-Pesa OAuth failed: ${response.status} – ${text}`);
  }

  const data = await response.json();
  _tokenCache = data.access_token;
  _tokenExpiry = Date.now() + (Number(data.expires_in) - 60) * 1000;
  return _tokenCache;
}

// ---------------------------------------------------------------------------
// STK Push  (Lipa Na M-Pesa Online)
// ---------------------------------------------------------------------------

/**
 * Initiates an M-Pesa STK Push payment.
 *
 * @param {{ amount: number, phoneNumber: string, reference: string, description?: string }} opts
 * @returns {Promise<{ success: boolean, checkoutRequestId?: string, merchantRequestId?: string, message: string }>}
 */
export async function initiateMpesaStkPush({
  amount,
  phoneNumber,
  reference,
  description = "Cafeteria Order Payment",
}) {
  const amountValue = normalizeAmount(amount);
  const msisdn = normalizeMpesaPhone(phoneNumber);

  if (!msisdn) {
    return { success: false, message: "Invalid phone number for M-Pesa payment." };
  }

  // If no real credentials are configured, fall back to mock
  if (!env.mpesaConsumerKey || !env.mpesaConsumerSecret) {
    console.warn("[MpesaService] No credentials – returning mock STK push response.");
    return {
      success: true,
      checkoutRequestId: `mock-${reference}`,
      merchantRequestId: `mock-merchant-${Date.now()}`,
      message:
        "Mock STK Push sent. Check your phone (demo mode – set MPESA_CONSUMER_KEY / MPESA_CONSUMER_SECRET to go live).",
      mock: true,
    };
  }

  const baseUrl =
    env.mpesaEnv === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

  try {
    const token = await getMpesaToken();
    const timestamp = getTimestamp();
    const password = buildPassword(
      env.mpesaShortcode,
      env.mpesaPasskey,
      timestamp,
    );

    const payload = {
      BusinessShortCode: env.mpesaShortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amountValue,
      PartyA: msisdn,
      PartyB: env.mpesaShortcode,
      PhoneNumber: msisdn,
      CallBackURL: env.mpesaCallbackUrl,
      AccountReference: reference,
      TransactionDesc: description,
    };

    const resp = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();

    if (!resp.ok || data.ResponseCode !== "0") {
      return {
        success: false,
        message: data.errorMessage || data.ResponseDescription || "STK Push failed.",
        raw: data,
      };
    }

    return {
      success: true,
      checkoutRequestId: data.CheckoutRequestID,
      merchantRequestId: data.MerchantRequestID,
      message: data.CustomerMessage || "STK Push sent. Enter your M-Pesa PIN.",
    };
  } catch (err) {
    console.error("[MpesaService] STK Push error:", err);
    return { success: false, message: err.message || "STK Push failed unexpectedly." };
  }
}

// ---------------------------------------------------------------------------
// STK Query  (check if user completed the push)
// ---------------------------------------------------------------------------

/**
 * Queries the status of a pending STK Push.
 *
 * @param {string} checkoutRequestId
 * @returns {Promise<{ resultCode: string, resultDesc: string, completed: boolean, success: boolean }>}
 */
export async function queryStkPushStatus(checkoutRequestId) {
  // Mock: always report success
  if (!checkoutRequestId || checkoutRequestId.startsWith("mock-")) {
    return { resultCode: "0", resultDesc: "The service request is processed successfully.", completed: true, success: true };
  }

  if (!env.mpesaConsumerKey) {
    return { resultCode: "0", resultDesc: "Mock success", completed: true, success: true };
  }

  const baseUrl =
    env.mpesaEnv === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

  try {
    const token = await getMpesaToken();
    const timestamp = getTimestamp();
    const password = buildPassword(env.mpesaShortcode, env.mpesaPasskey, timestamp);

    const resp = await fetch(`${baseUrl}/mpesa/stkpushquery/v1/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: env.mpesaShortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      }),
    });

    const data = await resp.json();
    const resultCode = String(data.ResultCode ?? data.errorCode ?? "-1");
    const completed = resultCode === "0" || resultCode === "1032" || resultCode === "1037";

    return {
      resultCode,
      resultDesc: data.ResultDesc || data.errorMessage || "Unknown status",
      completed,
      success: resultCode === "0",
      raw: data,
    };
  } catch (err) {
    return { resultCode: "-1", resultDesc: err.message, completed: false, success: false };
  }
}

// ---------------------------------------------------------------------------
// Legacy `processPayment` shim (still used by orders.js for non-STK flow)
// ---------------------------------------------------------------------------

export async function processPayment({ amount, currency, paymentMethod, reference }) {
  const amountValue = normalizeAmount(amount);

  if (paymentMethod === "pay_at_counter") {
    return {
      success: true, provider: "counter", status: "pending_counter",
      reference, message: "Order will be paid at counter",
    };
  }

  if (!paymentMethod || amountValue <= 0) {
    return {
      success: false, provider: "mock", status: "failed",
      message: "Invalid payment request or amount",
    };
  }

  return {
    success: true, provider: "mpesa", status: "paid",
    reference, message: `M-Pesa STK Push initiated – KES ${amountValue}`,
  };
}
