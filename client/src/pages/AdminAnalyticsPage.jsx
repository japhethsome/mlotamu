import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../lib/api.js";

export default function AdminAnalyticsPage() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState({
    sales: [],
    bestSelling: [],
    byMeal: [],
    totals: {},
  });

  useEffect(() => {
    if (!token) return;
    apiRequest("/admin/analytics", {}, token)
      .then((data) => setAnalytics(data))
      .catch(() =>
        setAnalytics({ sales: [], bestSelling: [], byMeal: [], totals: {} }),
      );
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-surface p-5">
          <p className="text-sm uppercase tracking-[0.12em] text-slate-500">
            Orders
          </p>
          <h3 className="mt-2 text-3xl font-bold">
            {analytics.totals.orders || 0}
          </h3>
        </div>
        <div className="card-surface p-5">
          <p className="text-sm uppercase tracking-[0.12em] text-slate-500">
            Revenue
          </p>
          <h3 className="mt-2 text-3xl font-bold">
            ${Number(analytics.totals.revenue || 0).toFixed(2)}
          </h3>
        </div>
        <div className="card-surface p-5">
          <p className="text-sm uppercase tracking-[0.12em] text-slate-500">
            Best seller
          </p>
          <h3 className="mt-2 text-xl font-bold">
            {analytics.bestSelling[0]?.menu_name || "N/A"}
          </h3>
        </div>
      </div>

      <div className="card-surface p-5">
        <h2 className="text-2xl font-bold">Revenue by day</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.sales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
