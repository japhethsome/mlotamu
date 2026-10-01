import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  XCircle,
  Clock,
  RefreshCw,
  Banknote,
  BadgeCheck,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { apiRequest } from "../lib/api.js";

// ─── Tip presets ─────────────────────────────────────────────────────────────
const TIP_PRESETS = [0, 20, 50, 100];

// ─── Payment status helpers ───────────────────────────────────────────────────
const PAYMENT_STATUS = {
  idle: "idle",
  sending: "sending",      // STK Push being sent
  waiting: "waiting",      // Waiting for user to enter PIN
  polling: "polling",      // Querying status
  paid: "paid",            // Payment confirmed
  failed: "failed",        // Payment failed / user cancelled
};

// ─── Utility ─────────────────────────────────────────────────────────────────
function formatKsh(amount) {
  return `KSh ${Number(amount).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");
  const [tip, setTip] = useState(0);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [pickupTime, setPickupTime] = useState("");
  const [error, setError] = useState("");

  // Payment flow state
  const [paymentStatus, setPaymentStatus] = useState(PAYMENT_STATUS.idle);
  const [statusMessage, setStatusMessage] = useState("");
  const [currentOrder, setCurrentOrder] = useState(null);
  const [checkoutRequestId, setCheckoutRequestId] = useState(null);
  const pollRef = useRef(null);
  const pollCount = useRef(0);

  // Derived totals
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );
  const tax = subtotal * 0.1;
  const discount = promoApplied ? subtotal * 0.1 : 0;
  const total = subtotal + tax + Number(tip) - discount;

  // ── Cleanup polling on unmount ──────────────────────────────────────────────
  useEffect(() => {
    return () => clearInterval(pollRef.current);
  }, []);

  // ── Promo code ─────────────────────────────────────────────────────────────
  const applyPromo = () => {
    if (promoCode.trim().toUpperCase() === "SAVE10") {
      setPromoApplied(true);
      setError("");
    } else {
      setPromoApplied(false);
      setError("Invalid promo code.");
    }
  };

  // ── Poll STK Push status ───────────────────────────────────────────────────
  const startPolling = (cId, orderId) => {
    pollCount.current = 0;
    clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      pollCount.current += 1;

      try {
        const result = await apiRequest(
          "/payments/mpesa/query",
          {
            method: "POST",
            body: JSON.stringify({ checkoutRequestId: cId, orderId }),
          },
          token,
        );

        if (result.success && result.completed) {
          clearInterval(pollRef.current);
          setPaymentStatus(PAYMENT_STATUS.paid);
          setStatusMessage("Payment confirmed! 🎉 Your order is being prepared.");
          clearCart();
          setTimeout(() => {
            navigate("/confirmation", { state: { order: currentOrder || { id: orderId } } });
          }, 2000);
          return;
        }

        if (result.completed && !result.success) {
          clearInterval(pollRef.current);
          setPaymentStatus(PAYMENT_STATUS.failed);
          setStatusMessage(result.resultDesc || "Payment was cancelled or failed.");
          return;
        }

        setStatusMessage(
          `Waiting for PIN… (${pollCount.current * 5}s elapsed – check your phone)`,
        );
      } catch {
        // Network blip – keep polling
      }

      // Timeout after 90 s (18 polls × 5 s)
      if (pollCount.current >= 18) {
        clearInterval(pollRef.current);
        setPaymentStatus(PAYMENT_STATUS.failed);
        setStatusMessage(
          "Payment timed out. Please try again or pay at the counter.",
        );
      }
    }, 5000);
  };

  // ── Main checkout handler ──────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (!items.length) { setError("Your cart is empty."); return; }
    const cleaned = phoneNumber.replace(/\D/g, "");
    if (cleaned.length < 9) {
      setError("Please enter a valid Kenyan phone number (e.g. 07XX XXX XXX).");
      return;
    }

    setError("");
    setPaymentStatus(PAYMENT_STATUS.sending);
    setStatusMessage("Placing your order…");

    try {
      // 1. Create the order
      const orderResp = await apiRequest(
        "/orders/checkout",
        {
          method: "POST",
          body: JSON.stringify({
            items: items.map(({ id, quantity, notes }) => ({ id, quantity, notes })),
            paymentMethod: "phone",
            phoneNumber: phoneNumber.trim(),
            tip: Number(tip || 0),
            promoCode: promoApplied ? promoCode : "",
            pickupTime,
          }),
        },
        token,
      );

      const order = orderResp.order;
      setCurrentOrder(order);

      // 2. Trigger STK Push
      setPaymentStatus(PAYMENT_STATUS.waiting);
      setStatusMessage("Sending M-Pesa STK Push to your phone…");

      const stkResp = await apiRequest(
        "/payments/mpesa/stk",
        {
          method: "POST",
          body: JSON.stringify({
            amount: total,
            phoneNumber: phoneNumber.trim(),
            orderId: order.id,
            reference: order.order_number,
            description: `Cafeteria – ${order.order_number}`,
          }),
        },
        token,
      );

      if (!stkResp.success) {
        setPaymentStatus(PAYMENT_STATUS.failed);
        setStatusMessage(stkResp.message || "STK Push failed. Try again.");
        return;
      }

      const cId = stkResp.checkoutRequestId;
      setCheckoutRequestId(cId);

      if (stkResp.mock) {
        // Demo mode – no real phone, skip polling
        setPaymentStatus(PAYMENT_STATUS.paid);
        setStatusMessage("Demo payment approved! 🎉");
        clearCart();
        setTimeout(() => navigate("/confirmation", { state: { order } }), 2000);
        return;
      }

      setStatusMessage("📱 Check your phone – enter your M-Pesa PIN to complete payment.");
      setPaymentStatus(PAYMENT_STATUS.polling);
      startPolling(cId, order.id);
    } catch (err) {
      setPaymentStatus(PAYMENT_STATUS.failed);
      setStatusMessage(err.message || "Checkout failed.");
      setError(err.message || "Checkout failed.");
    }
  };

  const retry = () => {
    clearInterval(pollRef.current);
    setPaymentStatus(PAYMENT_STATUS.idle);
    setStatusMessage("");
    setError("");
  };

  // ── Empty cart ─────────────────────────────────────────────────────────────
  if (!items.length && paymentStatus === PAYMENT_STATUS.idle) {
    return (
      <div className="card-surface p-10 text-center">
        <Banknote size={48} className="mx-auto text-slate-300 mb-4" />
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-slate-500">Add a few meals before checking out.</p>
      </div>
    );
  }

  // ── Payment in progress overlay ────────────────────────────────────────────
  if (
    paymentStatus === PAYMENT_STATUS.sending ||
    paymentStatus === PAYMENT_STATUS.waiting ||
    paymentStatus === PAYMENT_STATUS.polling ||
    paymentStatus === PAYMENT_STATUS.paid ||
    paymentStatus === PAYMENT_STATUS.failed
  ) {
    const isPaid = paymentStatus === PAYMENT_STATUS.paid;
    const isFailed = paymentStatus === PAYMENT_STATUS.failed;
    const isLoading = !isPaid && !isFailed;

    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="card-surface w-full max-w-md p-8 text-center shadow-2xl border border-slate-200 dark:border-slate-800">
          {/* Status icon */}
          <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-all ${
            isPaid
              ? "bg-emerald-500 shadow-emerald-400/40"
              : isFailed
              ? "bg-rose-500 shadow-rose-400/40"
              : "bg-emerald-600 shadow-emerald-600/30"
          }`}>
            {isPaid ? (
              <BadgeCheck size={44} className="text-white" />
            ) : isFailed ? (
              <XCircle size={44} className="text-white" />
            ) : (
              <Loader2 size={40} className="animate-spin text-white" />
            )}
          </div>

          {/* Title */}
          <h2 className={`text-2xl font-black mb-2 ${
            isPaid
              ? "text-emerald-600 dark:text-emerald-400"
              : isFailed
              ? "text-rose-600 dark:text-rose-400"
              : "text-slate-900 dark:text-slate-100"
          }`}>
            {isPaid ? "Payment Confirmed!" : isFailed ? "Payment Failed" : "Processing Payment"}
          </h2>

          {/* Status message */}
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            {statusMessage}
          </p>

          {/* M-Pesa steps (shown while waiting) */}
          {isLoading && (
            <div className="mb-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 text-left space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-3">
                Steps to complete
              </p>
              {[
                "A prompt has been sent to your phone",
                "Tap the M-Pesa notification",
                "Enter your M-Pesa PIN",
                "Wait for confirmation SMS",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="flex-shrink-0 h-5 w-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-xs text-slate-700 dark:text-slate-300">{step}</span>
                </div>
              ))}
            </div>
          )}

          {/* Timer / total */}
          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-4">
              <Clock size={14} />
              <span>Waiting up to 90 seconds…</span>
            </div>
          )}

          {/* Actions */}
          {isFailed && (
            <div className="space-y-3 mt-2">
              <button
                onClick={handleCheckout}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} /> Retry Payment
              </button>
              <button
                onClick={retry}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 py-3 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Edit Details
              </button>
            </div>
          )}

          {isPaid && (
            <div className="mt-2 text-xs text-slate-400 flex items-center justify-center gap-1">
              <Loader2 size={12} className="animate-spin" />
              Redirecting to confirmation…
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Main checkout form ─────────────────────────────────────────────────────
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
      {/* ── Left: order details + payment ──────────────────────────────────── */}
      <div className="card-surface p-6 shadow-xl border border-slate-200/80 dark:border-slate-800">
        <h1 className="text-3xl font-extrabold text-savori-brown dark:text-savori-cream">
          Checkout &amp; Payment
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your order and pay via M-Pesa STK Push
        </p>

        {/* Items */}
        <div className="mt-6 space-y-2.5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Items Ordered
          </p>
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 p-3.5 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50"
            >
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
              </div>
              <strong className="font-mono text-savori-brown dark:text-savori-cream">
                {formatKsh(item.price * item.quantity)}
              </strong>
            </div>
          ))}
        </div>

        {/* Promo + pickup */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Promo Code
            </label>
            <div className="flex gap-2">
              <input
                value={promoCode}
                onChange={(e) => { setPromoCode(e.target.value); setPromoApplied(false); }}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-savori-orange/30"
                placeholder="e.g. SAVE10"
              />
              <button
                onClick={applyPromo}
                className="rounded-2xl bg-savori-orange/10 hover:bg-savori-orange/20 px-4 text-xs font-bold text-savori-orange transition-colors"
              >
                Apply
              </button>
            </div>
            {promoApplied && (
              <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={12} /> 10% discount applied!
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Estimated Pickup Time
            </label>
            <input
              type="datetime-local"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-savori-orange/30"
            />
          </div>
        </div>

        {/* M-Pesa section */}
        <div className="mt-8 rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50/80 via-white to-orange-50/50 p-6 dark:border-emerald-500/30 dark:from-slate-900 dark:to-emerald-950/20 shadow-md">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
              <Smartphone size={24} />
            </div>
            <div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                M-Pesa STK Push
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Pay via Phone (Lipa Na M-Pesa)
              </h3>
            </div>
          </div>

          {/* Phone input */}
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            M-Pesa Phone Number
          </label>
          <div className="relative mb-3">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <span className="font-bold text-sm text-emerald-700 dark:text-emerald-400">
                🇰🇪 +254
              </span>
            </div>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="07XX XXX XXX"
              className="w-full rounded-2xl border-2 border-emerald-500/50 bg-white py-3 pl-24 pr-4 font-mono text-base font-bold text-slate-900 shadow-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20 dark:border-emerald-600/50 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600 flex-shrink-0" />
            An STK Push prompt will be sent to this number. Enter your M-Pesa PIN on your device
            to complete the payment instantly.
          </p>

          {/* How it works */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              { icon: "📲", label: "Receive prompt" },
              { icon: "🔑", label: "Enter PIN" },
              { icon: "✅", label: "Order confirmed" },
            ].map(({ icon, label }) => (
              <div
                key={label}
                className="rounded-xl bg-white/70 dark:bg-slate-800/70 py-2 px-1 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                <span className="text-xl block mb-1">{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/40 p-3 flex items-start gap-2">
            <AlertTriangle size={16} className="text-rose-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-rose-700 dark:text-rose-300">{error}</p>
          </div>
        )}
      </div>

      {/* ── Right: summary + CTA ──────────────────────────────────────────── */}
      <aside className="card-surface p-6 shadow-xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            Payment Summary
          </h2>

          {/* Tip presets */}
          <div className="mt-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Add a Tip (KSh)
            </label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {TIP_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setTip(preset)}
                  className={`rounded-xl py-2 text-xs font-bold transition-all ${
                    Number(tip) === preset
                      ? "bg-savori-orange text-white shadow-md shadow-savori-orange/30"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {preset === 0 ? "None" : `+${preset}`}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="0"
              step="10"
              value={tip}
              onChange={(e) => setTip(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-savori-orange/30"
              placeholder="Custom tip amount"
            />
          </div>

          {/* Totals */}
          <div className="mt-5 space-y-2.5 text-sm divide-y divide-slate-100 dark:divide-slate-800">
            <div className="flex justify-between pt-1">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold">{formatKsh(subtotal)}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-slate-500">VAT (10%)</span>
              <span className="font-semibold">{formatKsh(tax)}</span>
            </div>
            {Number(tip) > 0 && (
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Tip</span>
                <span className="font-semibold">{formatKsh(tip)}</span>
              </div>
            )}
            {promoApplied && (
              <div className="flex justify-between pt-2 text-emerald-600">
                <span className="font-semibold">Discount (SAVE10)</span>
                <span className="font-semibold">-{formatKsh(discount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 text-lg font-black text-savori-brown dark:text-savori-cream">
              <span>Total Payable</span>
              <span className="font-mono">{formatKsh(total)}</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 space-y-3">
          <button
            type="button"
            id="checkout-pay-btn"
            onClick={handleCheckout}
            className="btn-primary w-full py-4 text-base font-black shadow-lg shadow-savori-orange/30 flex items-center justify-center gap-2"
          >
            <Smartphone size={20} />
            Pay {formatKsh(total)} via M-Pesa
          </button>
          <p className="text-center text-[11px] text-slate-400">
            🔒 Secured via Safaricom M-Pesa. Receipt generated immediately.
          </p>
        </div>
      </aside>
    </div>
  );
}
