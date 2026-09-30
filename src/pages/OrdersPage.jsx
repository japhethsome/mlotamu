import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../lib/api.js";

export default function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!token) return;
    apiRequest("/orders/my", {}, token)
      .then((data) => setOrders(data))
      .catch(() => setOrders([]));
  }, [token]);

  return (
    <div className="space-y-5">
      <div className="card-surface p-5">
        <h1 className="text-3xl font-bold">My orders</h1>
      </div>

      {orders.length === 0 ? (
        <div className="card-surface p-8 text-center text-slate-500">
          No orders yet.
        </div>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="card-surface p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.15em] text-savori-orange">
                  {order.order_number}
                </p>
                <h2 className="mt-1 text-xl font-bold">{order.status}</h2>
              </div>
              <button
                type="button"
                className="btn-secondary inline-flex items-center gap-2"
              >
                <Download size={15} /> Receipt
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {order.items?.map((item) => (
                <div
                  key={`${order.id}-${item.id}`}
                  className="flex justify-between text-sm text-slate-600"
                >
                  <span>
                    {item.menu_name} x {item.quantity}
                  </span>
                  <span>
                    KSh {(Number(item.unit_price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-between border-t border-slate-200 pt-3 text-sm font-medium dark:border-slate-700">
              <span>Total</span>
              <span>KSh {Number(order.total).toFixed(2)}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
