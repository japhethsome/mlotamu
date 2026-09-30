import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Smartphone, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { apiRequest } from "../lib/api.js";

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "0712345678");
  const [tip, setTip] = useState(0);
  const [promoCode, setPromoCode] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );
  const tax = subtotal * 0.1;
  const total = subtotal + tax + Number(tip);

  const handleCheckout = async () => {
    if (!items.length) {
      setError("Your cart is empty.");
      return;
    }

    if (!phoneNumber || phoneNumber.trim().length < 9) {
      setError("Please enter a valid phone number for payment (e.g. 0712 345 678).");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await apiRequest(
        "/orders/checkout",
        {
          method: "POST",
          body: JSON.stringify({
            items: items.map(({ id, quantity, notes }) => ({
              id,
              quantity,
              notes,
            })),
            paymentMethod: "phone",
            phoneNumber: phoneNumber.trim(),
            tip: Number(tip || 0),
            promoCode,
            pickupTime,
          }),
        },
        token,
      );

      clearCart();
      navigate("/confirmation", { state: { order: response.order } });
    } catch (err) {
      setError(err.message || "Checkout failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!items.length) {
    return (
      <div className="card-surface p-10 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-slate-500">
          Add a few meals before checking out.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
      <div className="card-surface p-6 shadow-xl border border-slate-200/80 dark:border-slate-800">
        <h1 className="text-3xl font-extrabold text-savori-brown dark:text-savori-cream">
          Checkout & Payment
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your order details and confirm phone payment
        </p>

        <div className="mt-6 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Items Ordered</p>
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 p-3.5 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50"
            >
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">{item.name}</h3>
                <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
              </div>
              <strong className="font-mono text-savori-brown dark:text-savori-cream">
                KSh {(item.price * item.quantity).toFixed(2)}
              </strong>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Promo code
            </label>
            <input
              value={promoCode}
              onChange={(event) => setPromoCode(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-savori-orange/30"
              placeholder="e.g. SAVE10"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Estimated Pickup Time
            </label>
            <input
              type="datetime-local"
              value={pickupTime}
              onChange={(event) => setPickupTime(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-savori-orange/30"
            />
          </div>
        </div>

        {/* Exclusive Payment Method: Phone / M-Pesa */}
        <div className="mt-8 rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50/80 via-white to-orange-50/50 p-6 dark:border-emerald-500/30 dark:from-slate-900 dark:to-emerald-950/20 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
                <Smartphone size={24} />
              </div>
              <div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Required Payment Method
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  Phone Payment (M-Pesa / Mobile Money)
                </h3>
              </div>
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 size={16} /> Selected
            </span>
          </div>

          <div className="mt-5 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Enter M-Pesa / Mobile Phone Number for Payment:
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <span className="font-bold text-sm text-emerald-700 dark:text-emerald-400">🇰🇪 +254</span>
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="07XX XXX XXX or 7XX XXX XXX"
                className="w-full rounded-2xl border-2 border-emerald-500/50 bg-white py-3 pl-24 pr-4 font-mono text-base font-bold text-slate-900 shadow-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20 dark:border-emerald-600/50 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
              <ShieldCheck size={14} className="text-emerald-600" />
              An instant STK Push prompt will be sent to your phone. Enter your M-Pesa PIN on your device to complete payment.
            </p>
          </div>
        </div>
      </div>

      <aside className="card-surface p-6 shadow-xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Payment Summary</h2>
          <div className="mt-5 space-y-2.5 text-sm divide-y divide-slate-100 dark:divide-slate-800">
            <div className="flex justify-between pt-1">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold">KSh {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-slate-500">Tax (10% VAT)</span>
              <span className="font-semibold">KSh {tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-slate-500">Optional Tip</span>
              <span className="font-semibold">KSh {Number(tip).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-3 text-lg font-black text-savori-brown dark:text-savori-cream">
              <span>Total Payable</span>
              <span className="font-mono">KSh {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Optional Tip (KSh)
            </label>
            <input
              type="number"
              min="0"
              step="10"
              value={tip}
              onChange={(event) => setTip(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none"
            />
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </div>
          ) : null}
        </div>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={handleCheckout}
            disabled={submitting}
            className="btn-primary w-full py-4 text-base font-black shadow-lg shadow-savori-orange/30 flex items-center justify-center gap-2"
          >
            <Smartphone size={20} />
            {submitting ? "Sending Phone Payment Prompt..." : `Pay KSh ${total.toFixed(2)} via Phone`}
          </button>
          <p className="text-center text-[11px] text-slate-400">
            🔒 Secured phone transaction. Official receipt generated immediately upon payment.
          </p>
        </div>
      </aside>
    </div>
  );
}
