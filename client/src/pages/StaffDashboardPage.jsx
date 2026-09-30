import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../lib/api.js";

export default function StaffDashboardPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({
    recentOrders: [],
    lowStock: [],
    orderCounts: [],
  });

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiRequest("/orders", {}, token),
      apiRequest("/staff/dashboard", {}, token),
    ])
      .then(([ordersData, dashboard]) => {
        setOrders(ordersData);
        setSummary(dashboard);
      })
      .catch(() => {
        setOrders([]);
        setSummary({ recentOrders: [], lowStock: [], orderCounts: [] });
      });
  }, [token]);

  const updateStatus = async (orderId, status) => {
    await apiRequest(
      `/orders/${orderId}/status`,
      { method: "PATCH", body: JSON.stringify({ status }) },
      token,
    );
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, status } : order,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {["received", "preparing", "ready", "collected"].map((status) => (
          <div key={status} className="card-surface p-4">
            <p className="text-sm uppercase tracking-[0.15em] text-slate-500">
              {status}
            </p>
            <h3 className="mt-2 text-3xl font-bold">
              {orders.filter((order) => order.status === status).length}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="card-surface p-5">
          <h2 className="text-2xl font-bold">Live orders</h2>
          <div className="mt-5 space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{order.order_number}</p>
                    <p className="text-sm text-slate-500">
                      {order.customer_name || "Customer"}
                    </p>
                  </div>
                  <span className="rounded-full bg-brand-100 px-2 py-1 text-xs font-semibold text-brand-700">
                    {order.status}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {["received", "preparing", "ready", "collected"].map(
                    (state) => (
                      <button
                        key={state}
                        type="button"
                        onClick={() => updateStatus(order.id, state)}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium dark:bg-slate-800"
                      >
                        {state}
                      </button>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="card-surface p-5">
          <h2 className="text-xl font-bold">Low stock</h2>
          <div className="mt-4 space-y-3">
            {(summary.lowStock || []).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <span>{item.name}</span>
                <span className="font-semibold text-amber-600">
                  {item.stock_quantity}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
