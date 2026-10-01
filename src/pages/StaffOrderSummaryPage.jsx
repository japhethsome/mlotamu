import { useState, useEffect, useCallback } from "react";
import { ClipboardList, RefreshCw, ChefHat, Clock, TrendingUp, Download, Calendar } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../lib/api.js";

const MEAL_PERIODS = [
  { label: "Breakfast", value: "breakfast", time: "06:00 – 09:00", color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-700" },
  { label: "Lunch",     value: "lunch",     time: "11:00 – 14:00", color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-700" },
  { label: "Dinner",    value: "dinner",    time: "16:00 – 20:00", color: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-700" },
  { label: "All Today", value: "all",       time: "Full Day",       color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700" },
];

function todayRange(period) {
  const now = new Date();
  const y = now.getFullYear(), m = String(now.getMonth()+1).padStart(2,"0"), d = String(now.getDate()).padStart(2,"0");
  const ranges = {
    breakfast: [`${y}-${m}-${d}T06:00:00`, `${y}-${m}-${d}T09:00:00`],
    lunch:     [`${y}-${m}-${d}T11:00:00`, `${y}-${m}-${d}T14:00:00`],
    dinner:    [`${y}-${m}-${d}T16:00:00`, `${y}-${m}-${d}T20:00:00`],
    all:       [`${y}-${m}-${d}T00:00:00`, `${y}-${m}-${d}T23:59:59`],
  };
  return ranges[period] || ranges.all;
}

export default function StaffOrderSummaryPage() {
  const { token } = useAuth();
  const [period, setPeriod] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/orders", {}, token);
      const allOrders = Array.isArray(data) ? data : (data?.orders || []);

      let from, to;
      if (useCustom && customFrom && customTo) {
        from = new Date(customFrom);
        to = new Date(customTo);
      } else {
        const [f, t] = todayRange(period);
        from = new Date(f);
        to = new Date(t);
      }

      const filtered = allOrders.filter((o) => {
        if (o.status === "cancelled") return false;
        const d = new Date(o.created_at);
        return d >= from && d <= to;
      });

      setOrders(filtered);
      setLastRefreshed(new Date());
    } catch (e) {
      setError(e.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [token, period, customFrom, customTo, useCustom]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Aggregate item quantities across all filtered orders
  const itemSummary = {};
  let totalRevenue = 0;
  let totalOrders = orders.length;

  for (const order of orders) {
    totalRevenue += Number(order.total || 0);
    const items = order.items || [];
    for (const item of items) {
      const key = item.menu_name;
      if (!itemSummary[key]) {
        itemSummary[key] = { name: key, qty: 0, revenue: 0, unitPrice: Number(item.unit_price) };
      }
      itemSummary[key].qty += item.quantity;
      itemSummary[key].revenue += Number(item.unit_price) * item.quantity;
    }
  }

  const summaryRows = Object.values(itemSummary).sort((a, b) => b.qty - a.qty);

  const handlePrint = () => window.print();

  const activePeriod = MEAL_PERIODS.find((p) => p.value === period);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-savori-brown dark:text-savori-cream flex items-center gap-2">
            <ChefHat size={30} /> Order Summary
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Aggregated quantities for kitchen preparation</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 transition-colors print:hidden">
            <Download size={14} /> Print
          </button>
          <button onClick={fetchOrders} disabled={loading}
            className="flex items-center gap-1.5 rounded-xl bg-savori-brown text-white px-4 py-2 text-xs font-bold shadow hover:bg-savori-brown/90 transition-colors print:hidden">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="card-surface p-4 space-y-3 print:hidden">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Filter by Meal Period</p>
        <div className="flex flex-wrap gap-2">
          {MEAL_PERIODS.map((mp) => (
            <button
              key={mp.value}
              onClick={() => { setPeriod(mp.value); setUseCustom(false); }}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-black transition-all ${
                !useCustom && period === mp.value
                  ? mp.color
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-savori-brown/40"
              }`}
            >
              <Clock size={13} />
              {mp.label}
              <span className="opacity-60 font-normal">{mp.time}</span>
            </button>
          ))}
        </div>

        {/* Custom range */}
        <div className="flex flex-wrap items-end gap-3 pt-1">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">From</label>
            <input type="datetime-local" value={customFrom}
              onChange={(e) => { setCustomFrom(e.target.value); setUseCustom(true); }}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-savori-orange/30" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">To</label>
            <input type="datetime-local" value={customTo}
              onChange={(e) => { setCustomTo(e.target.value); setUseCustom(true); }}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-savori-orange/30" />
          </div>
          {useCustom && customFrom && customTo && (
            <button onClick={fetchOrders}
              className="rounded-xl bg-savori-orange px-4 py-2 text-xs font-bold text-white hover:bg-savori-orange/90 transition-colors">
              Apply
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-800 p-4 text-sm text-rose-600 dark:text-rose-300 font-medium">
          {error}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Orders", value: totalOrders, icon: <ClipboardList size={20} />, color: "text-blue-600" },
          { label: "Total Revenue", value: `KSh ${totalRevenue.toFixed(2)}`, icon: <TrendingUp size={20} />, color: "text-emerald-600" },
          { label: "Unique Items", value: summaryRows.length, icon: <ChefHat size={20} />, color: "text-savori-orange" },
        ].map((s) => (
          <div key={s.label} className="card-surface p-4 text-center">
            <div className={`flex justify-center mb-1 ${s.color}`}>{s.icon}</div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{s.value}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main Summary Table */}
      <div className="card-surface overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ChefHat size={18} className="text-savori-orange" />
              Kitchen Preparation List
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {useCustom ? `${customFrom} → ${customTo}` : `${activePeriod?.label} · ${activePeriod?.time}`}
              {lastRefreshed && ` · Updated ${lastRefreshed.toLocaleTimeString()}`}
            </p>
          </div>
          {!useCustom && (
            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${activePeriod?.color}`}>
              {activePeriod?.label}
            </span>
          )}
        </div>

        {summaryRows.length === 0 ? (
          <div className="py-16 text-center">
            <ChefHat size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <p className="font-bold text-slate-400">No orders found for this period</p>
            <p className="text-xs text-slate-400 mt-1">Orders will appear here as customers place them</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50">
              <span>Item Name</span>
              <span className="text-center">Unit Price</span>
              <span className="text-center w-20">Qty to Cook</span>
              <span className="text-right w-28">Revenue</span>
            </div>

            {summaryRows.map((row, i) => (
              <div key={row.name}
                className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-4 items-center ${i % 2 === 0 ? "" : "bg-slate-50/50 dark:bg-slate-800/20"}`}>
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{row.name}</span>
                </div>
                <span className="text-sm text-slate-500 font-mono text-center">
                  KSh {row.unitPrice.toFixed(2)}
                </span>
                <div className="flex justify-center w-20">
                  <span className="flex h-9 w-16 items-center justify-center rounded-xl bg-savori-orange/10 dark:bg-savori-orange/20 border-2 border-savori-orange/30 text-lg font-black text-savori-orange">
                    {row.qty}
                  </span>
                </div>
                <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300 text-right w-28">
                  KSh {row.revenue.toFixed(2)}
                </span>
              </div>
            ))}

            {/* Total row */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-4 bg-savori-brown/5 dark:bg-savori-cream/5 border-t-2 border-savori-brown/20 dark:border-savori-cream/20">
              <span className="font-black text-savori-brown dark:text-savori-cream uppercase text-sm tracking-wide">
                TOTAL
              </span>
              <span />
              <span className="text-center w-20 font-black text-savori-brown dark:text-savori-cream">
                {summaryRows.reduce((s, r) => s + r.qty, 0)}
              </span>
              <span className="text-right w-28 font-black text-savori-brown dark:text-savori-cream font-mono">
                KSh {totalRevenue.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Individual orders quick view */}
      {orders.length > 0 && (
        <div className="card-surface p-5 print:hidden">
          <h3 className="font-black text-slate-700 dark:text-slate-300 mb-3 text-sm uppercase tracking-wider">
            Individual Orders ({orders.length})
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 px-4 py-2.5 text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-savori-orange text-xs">{o.order_number}</span>
                  <span className="text-slate-500 text-xs">{o.customer_name || "Customer"}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    o.status === "collected" ? "bg-slate-100 dark:bg-slate-800 text-slate-500" :
                    o.status === "ready"     ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" :
                    o.status === "preparing" ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300" :
                    "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                  }`}>{o.status}</span>
                </div>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  KSh {Number(o.total).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
