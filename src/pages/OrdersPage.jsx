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
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-orange-100 dark:bg-orange-950 px-2.5 py-1 text-xs font-mono font-bold text-savori-orange">
                    REF: #{order.order_number?.replace("ORD-", "") || order.id}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {order.order_number}
                  </span>
                </div>
                <h2 className="mt-1 text-lg font-bold capitalize text-slate-900 dark:text-slate-100">
                  Status: <span className={order.status === "collected" ? "text-slate-500" : "text-savori-green font-black"}>{order.status}</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Placed on {new Date(order.created_at).toLocaleString()}
                </p>
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
