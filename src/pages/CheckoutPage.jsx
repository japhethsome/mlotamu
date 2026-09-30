import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { apiRequest } from "../lib/api.js";

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("card");
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
            paymentMethod,
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
      <div className="card-surface p-5">
        <h1 className="text-3xl font-bold">Checkout</h1>

        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 dark:border-slate-700"
            >
              <div>
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
              </div>
              <strong>KSh {(item.price * item.quantity).toFixed(2)}</strong>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium">Promo code</label>
          <input
            value={promoCode}
            onChange={(event) => setPromoCode(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
            placeholder="SAVE10"
          />
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium">Pickup time</label>
          <input
            type="datetime-local"
            value={pickupTime}
            onChange={(event) => setPickupTime(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        <div className="mt-6">
          <p className="mb-2 font-medium">Payment method</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {["card", "mobile_money", "wallet", "pay_at_counter"].map(
              (method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`rounded-2xl border px-4 py-3 text-left ${paymentMethod === method ? "border-savori-orange bg-savori-orange/10 text-savori-orange" : "border-slate-200 dark:border-slate-700"}`}
                >
                  {method.replace("_", " ")}
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      <aside className="card-surface p-5">
        <h2 className="text-2xl font-bold">Summary</h2>
        <div className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>KSh {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>KSh {tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tip</span>
            <span>KSh {Number(tip).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>KSh {total.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-medium">Optional tip</label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={tip}
            onChange={(event) => setTip(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

        <button
          type="button"
          onClick={handleCheckout}
          disabled={submitting}
          className="btn-primary mt-6 w-full"
        >
          {submitting ? "Processing..." : `Pay KSh ${total.toFixed(2)}`}
        </button>
      </aside>
    </div>
  );
}
