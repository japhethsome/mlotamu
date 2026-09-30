import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

export default function CartDrawer() {
  const { items, updateQuantity, removeItem, clearCart } = useCart();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onToggle = () => setOpen((value) => !value);
    document.addEventListener("toggle-cart-drawer", onToggle);
    return () => document.removeEventListener("toggle-cart-drawer", onToggle);
  }, []);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-center gap-2 font-semibold">
              <ShoppingBag size={18} />
              Your cart
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                Your cart is empty.
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 p-3 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-slate-500">
                        KSh {item.price.toFixed(2)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-rose-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-2 py-1 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="min-w-6 text-center text-sm">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <strong>KSh {(item.price * item.quantity).toFixed(2)}</strong>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-200 p-4 dark:border-slate-700">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>KSh {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>KSh {tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>KSh {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={clearCart}
                className="btn-secondary flex-1 py-2 text-sm"
              >
                Clear
              </button>
              <Link
                to="/checkout"
                onClick={() => setOpen(false)}
                className="btn-primary flex-1 py-2 text-sm"
              >
                Checkout
              </Link>
            </div>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
