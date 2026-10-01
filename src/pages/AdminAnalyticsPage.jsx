import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
  Package,
  Plus,
  Search,
  Shield,
  Clock,
  Download,
  CheckCircle2,
  AlertTriangle,
  Edit,
  X,
  RefreshCw,
  Sliders,
  FileText,
  Utensils,
  ChevronDown,
  ChefHat,
  ClipboardList,
  QrCode,
  ChevronRight,
  Activity,
  Layers,
  Menu as MenuIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../lib/api.js";

const CATEGORY_COLORS = {
  breakfast: "#f59e0b",
  lunch: "#ef4444",
  dinner: "#8b5cf6",
  supper: "#6366f1",
};

export default function AdminAnalyticsPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("overview"); // "overview", "menu", "orders", "users", "audit"
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [analytics, setAnalytics] = useState({
    sales: [],
    bestSelling: [],
    byMeal: [],
    totals: {},
  });
  const [inventory, setInventory] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [auditLogs, setAuditLogs] = useState({ priceLogs: [], auditLogs: [] });

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // New Meal Modal state
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [newMealForm, setNewMealForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "breakfast",
    stockQuantity: "30",
    image: "",
    startTime: "06:00",
    endTime: "09:00",
  });

  // Edit Meal state
  const [editingMeal, setEditingMeal] = useState(null);
  const [editPriceForm, setEditPriceForm] = useState({ price: "", reason: "" });

  const fetchAllData = async () => {
    if (!token) return;
    try {
      setRefreshing(true);
      const [analyticsData, inventoryData, usersData, ordersData, auditData] =
        await Promise.all([
          apiRequest("/admin/analytics", {}, token).catch(() => ({
            sales: [],
            bestSelling: [],
            byMeal: [],
            totals: {},
          })),
          apiRequest("/admin/inventory", {}, token).catch(() => []),
          apiRequest("/admin/users", {}, token).catch(() => []),
          apiRequest("/admin/orders", {}, token).catch(() => []),
          apiRequest("/admin/audit-logs", {}, token).catch(() => ({
            priceLogs: [],
            auditLogs: [],
          })),
        ]);

      setAnalytics(analyticsData);
      setInventory(inventoryData || []);
      setUsers(usersData || []);
      setOrders(ordersData || []);
      setAuditLogs(auditData || { priceLogs: [], auditLogs: [] });
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [token]);

  // Handle User Role Change
  const handleChangeRole = async (userId, newRole) => {
    try {
      await apiRequest(
        `/admin/users/${userId}/role`,
        { method: "PATCH", body: JSON.stringify({ role: newRole }) },
        token,
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
      alert(`User role updated to ${newRole}`);
    } catch (err) {
      alert(err.message || "Failed to update user role.");
    }
  };

  // Toggle meal availability
  const handleToggleMeal = async (meal) => {
    const nextState = !meal.is_available;
    try {
      await apiRequest(
        `/menu/${meal.id}/availability`,
        { method: "PATCH", body: JSON.stringify({ isAvailable: nextState }) },
        token,
      );
      setInventory((prev) =>
        prev.map((m) =>
          m.id === meal.id ? { ...m, is_available: nextState ? 1 : 0 } : m,
        ),
      );
    } catch (err) {
      alert(err.message || "Failed to toggle meal.");
    }
  };

  // Save new meal
  const handleCreateMeal = async (e) => {
    e.preventDefault();
    try {
      await apiRequest(
        "/menu",
        {
          method: "POST",
          body: JSON.stringify({
            name: newMealForm.name,
            description: newMealForm.description,
            price: Number(newMealForm.price),
            category: newMealForm.category,
            stockQuantity: Number(newMealForm.stockQuantity),
            image: newMealForm.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
            dietaryTags: [],
            allergens: [],
            isAvailable: true,
            servingHours: {
              start: newMealForm.startTime,
              end: newMealForm.endTime,
            },
          }),
        },
        token,
      );
      setIsAddMealOpen(false);
      setNewMealForm({
        name: "",
        description: "",
        price: "",
        category: "breakfast",
        stockQuantity: "30",
        image: "",
        startTime: "06:00",
        endTime: "09:00",
      });
      fetchAllData();
      alert("New meal added successfully!");
    } catch (err) {
      alert(err.message || "Failed to create meal item.");
    }
  };

  // Save Price Change with reason
  const handleSavePrice = async (e) => {
    e.preventDefault();
    if (!editingMeal) return;
    try {
      await apiRequest(
        `/menu/${editingMeal.id}/price`,
        {
          method: "PATCH",
          body: JSON.stringify({
            newPrice: Number(editPriceForm.price),
            reason: editPriceForm.reason || "Admin price update",
          }),
        },
        token,
      );
      setEditingMeal(null);
      fetchAllData();
      alert("Price updated and recorded in audit log.");
    } catch (err) {
      alert(err.message || "Failed to update price.");
    }
  };

  // Export report to CSV
  const handleExportCSV = () => {
    const headers = "Order Number,Customer,Total,Status,Payment Method,Date\n";
    const rows = orders
      .map(
        (o) =>
          `"${o.order_number}","${o.customer_name || ""}",${o.total},"${o.status}","${o.payment_method}","${o.created_at}"`,
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `savori-orders-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const totalRevenue = Number(analytics.totals?.revenue || 0);
  const totalOrdersCount = Number(analytics.totals?.orders || orders.length || 0);
  const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
  const activeOrdersCount = orders.filter(
    (o) => o.status !== "collected" && o.status !== "cancelled",
  ).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="card-surface p-6 shadow-xl border border-slate-200/80 dark:border-savori-brownLight/40 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-savori-brown to-amber-900 text-white shadow-lg shadow-savori-brown/30">
            <Shield size={30} className="text-savori-orange" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-savori-brown dark:text-savori-cream">
              Executive Administration & Control
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Live financial revenue, menu management, user authorization & system auditing
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            type="button"
            onClick={fetchAllData}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-xl bg-savori-orange px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-savori-orange/30 hover:bg-savori-green transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Syncing..." : "Sync Live Data"}
          </button>
        </div>
      </div>

      {/* Admin Executive Layout: Left Sidebar + Right Main Content */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* LEFT SIDEBAR */}
        <aside className="w-full lg:w-64 xl:w-72 shrink-0 lg:sticky lg:top-20 space-y-4">
          <div className="card-surface p-4 border border-slate-200/80 dark:border-slate-800 shadow-xl rounded-3xl space-y-5">
            {/* Admin identity badge */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-savori-brown/10 via-savori-orange/10 to-amber-500/10 border border-savori-orange/20 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-savori-brown to-amber-900 flex items-center justify-center text-white shadow-md shrink-0">
                <Shield size={20} className="text-savori-orange" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-black uppercase tracking-wider text-savori-orange">Executive Console</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">Administrator Portal</p>
              </div>
            </div>

            {/* Sidebar Navigation Items */}
            <div className="space-y-1">
              <p className="px-3 pt-1 pb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                Administrative Views
              </p>
              {[
                { key: "overview", label: "Financial Analytics", icon: TrendingUp, badge: null },
                { key: "menu", label: "Menu & Dish Catalog", icon: Utensils, badge: inventory.length },
                { key: "orders", label: "All Orders & Receipts", icon: ShoppingBag, badge: orders.length },
                { key: "users", label: "User Roles & Access", icon: Users, badge: users.length },
                { key: "audit", label: "Price Audit Logs", icon: FileText, badge: auditLogs.priceLogs?.length || 0 },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveTab(item.key)}
                    className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left group ${
                      isSelected
                        ? "bg-gradient-to-r from-savori-orange to-amber-600 text-white shadow-lg shadow-savori-orange/30 translate-x-1"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icon size={17} className={isSelected ? "text-white" : "text-slate-400 group-hover:text-savori-orange"} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge !== null ? (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                          isSelected
                            ? "bg-white/25 text-white"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight
                        size={14}
                        className={`transition-opacity shrink-0 ${
                          isSelected ? "opacity-100 text-white" : "opacity-0 group-hover:opacity-100 text-slate-400"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions inside Sidebar */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <p className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                Quick Actions
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("menu");
                  setIsAddMealOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-savori-orange py-2.5 px-3 text-xs font-black text-white shadow-md shadow-savori-orange/30 hover:bg-savori-green hover:shadow-savori-green/30 transition-all transform active:scale-95"
              >
                <Plus size={15} /> + Add New Meal
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
              >
                <Download size={14} /> Export CSV Report
              </button>
            </div>

            {/* Operational Portals */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
              <p className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                Staff Portals
              </p>
              <Link
                to="/staff"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <ChefHat size={15} className="text-amber-500" />
                  <span>Kitchen Hub</span>
                </div>
                <span className="text-[10px] text-slate-400 group-hover:text-savori-orange">&rarr;</span>
              </Link>
              <Link
                to="/staff/summary"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <ClipboardList size={15} className="text-orange-500" />
                  <span>Prep Summary</span>
                </div>
                <span className="text-[10px] text-slate-400 group-hover:text-savori-orange">&rarr;</span>
              </Link>
              <Link
                to="/scan"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <QrCode size={15} className="text-emerald-500" />
                  <span>QR Scanner</span>
                </div>
                <span className="text-[10px] text-slate-400 group-hover:text-savori-orange">&rarr;</span>
              </Link>
            </div>

            {/* Status indicator */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 px-2 text-[11px] text-slate-500 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>POS & DB Active</span>
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT */}
        <main className="flex-1 w-full min-w-0 space-y-6">
          {/* Top KPI Metric Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="card-surface p-5 border border-slate-200/80 dark:border-slate-800 shadow-md">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                <span>Total Revenue</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <DollarSign size={16} />
                </div>
              </div>
              <h3 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                KSh {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <TrendingUp size={13} /> Active financial transactions
              </p>
            </div>

            <div className="card-surface p-5 border border-slate-200/80 dark:border-slate-800 shadow-md">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                <span>Total Orders</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400">
                  <ShoppingBag size={16} />
                </div>
              </div>
              <h3 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                {totalOrdersCount}
              </h3>
              <p className="mt-1 text-xs text-slate-500 font-semibold">
                {activeOrdersCount} in active kitchen fulfillment
              </p>
            </div>

            <div className="card-surface p-5 border border-slate-200/80 dark:border-slate-800 shadow-md">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                <span>Average Order Value</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                  <Sliders size={16} />
                </div>
              </div>
              <h3 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                KSh {avgOrderValue.toFixed(0)}
              </h3>
              <p className="mt-1 text-xs text-slate-500 font-semibold">
                Per customer cart checkout
              </p>
            </div>

            <div className="card-surface p-5 border border-slate-200/80 dark:border-slate-800 shadow-md">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                <span>Registered Users</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400">
                  <Users size={16} />
                </div>
              </div>
              <h3 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                {users.length}
              </h3>
              <p className="mt-1 text-xs text-slate-500 font-semibold">
                {users.filter((u) => u.role === "staff").length} Staff • {users.filter((u) => u.role === "admin").length} Admins
              </p>
            </div>
          </div>

          {/* Mobile Horizontal Pill Scroller (Visible on small screens) */}
          <div className="flex lg:hidden overflow-x-auto gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            {[
              { key: "overview", label: "Financial Analytics", icon: TrendingUp },
              { key: "menu", label: "Menu Catalog", icon: Utensils },
              { key: "orders", label: "All Orders", icon: ShoppingBag },
              { key: "users", label: "User Roles", icon: Users },
              { key: "audit", label: "Audit Logs", icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                    activeTab === tab.key
                      ? "bg-savori-orange text-white shadow-md"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  <Icon size={14} /> {tab.label}
                </button>
              );
            })}
          </div>

      {/* TAB 1: OVERVIEW & ANALYTICS CHARTS */}
      {activeTab === "overview" ? (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue Trend Chart */}
            <div className="card-surface p-5 border border-slate-200/80 dark:border-slate-800 shadow-md">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                Daily Revenue Velocity (KSh)
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Historical gross intake across all completed orders
              </p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.sales.slice(0, 14).reverse()}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val) => [`KSh ${Number(val).toLocaleString()}`, "Revenue"]}
                    />
                    <Bar dataKey="revenue" fill="#FF6B00" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sales by Meal Category */}
            <div className="card-surface p-5 border border-slate-200/80 dark:border-slate-800 shadow-md">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                Sales by Meal Service Window
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Intake distribution between Breakfast, Lunch, and Dinner
              </p>
              <div className="h-72 flex items-center justify-center">
                {analytics.byMeal?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.byMeal}
                        dataKey="revenue"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={95}
                        innerRadius={50}
                        paddingAngle={4}
                        label={(entry) => `${entry.category}: KSh ${Number(entry.revenue).toLocaleString()}`}
                      >
                        {analytics.byMeal.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CATEGORY_COLORS[entry.category] || "#4CAF50"}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `KSh ${Number(v).toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-slate-400">No meal breakdown data yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Top Selling Dishes Ranking */}
          <div className="card-surface p-5 border border-slate-200/80 dark:border-slate-800 shadow-md">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">
              🏆 Top 5 Best-Selling Dishes of All Time
            </h3>
            <div className="grid gap-3 sm:grid-cols-5">
              {analytics.bestSelling?.map((dish, i) => (
                <div
                  key={dish.menu_name}
                  className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60 flex flex-col justify-between"
                >
                  <span className="text-xs font-bold text-savori-orange">#{i + 1} Best Seller</span>
                  <h4 className="mt-1 font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-2">
                    {dish.menu_name}
                  </h4>
                  <p className="mt-2 text-xl font-black text-savori-brown dark:text-savori-cream">
                    {dish.quantity} <span className="text-xs font-normal text-slate-500">units sold</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* TAB 2: MENU & DISH CATALOG */}
      {activeTab === "menu" ? (
        <div className="card-surface p-6 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Menu Items & Pricing Architecture
              </h2>
              <p className="text-xs text-slate-500">
                Full catalog of dishes, categories, serving hours, pricing, and stock controls.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddMealOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-savori-orange px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-savori-orange/30 hover:bg-savori-green transition-colors"
            >
              <Plus size={16} /> Add New Dish
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3">Item</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Serving Hours</th>
                  <th className="py-3 px-3">Price (KSh)</th>
                  <th className="py-3 px-3">Stock</th>
                  <th className="py-3 px-3">Available</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image || "/logo.png"}
                          alt={item.name}
                          className="h-10 w-10 rounded-xl object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{item.name}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{item.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 capitalize font-semibold text-slate-600 dark:text-slate-400">
                      {item.category}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs">
                      {item.serving_hours ? JSON.parse(item.serving_hours).start : "06:00"} -{" "}
                      {item.serving_hours ? JSON.parse(item.serving_hours).end : "20:00"}
                    </td>
                    <td className="py-3 px-3 font-bold text-savori-brown dark:text-savori-cream">
                      KSh {Number(item.price).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                      {item.stock_quantity}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggleMeal(item)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          item.is_available
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {item.is_available ? "Active" : "Closed"}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMeal(item);
                          setEditPriceForm({ price: item.price, reason: "" });
                        }}
                        className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                      >
                        Edit Price
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* TAB 3: ALL ORDERS & RECEIPTS */}
      {activeTab === "orders" ? (
        <div className="card-surface p-6 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Complete Order Ledger
              </h2>
              <p className="text-xs text-slate-500">
                Chronological record of cafeteria orders with line items, reference codes & customer identities.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-3 text-slate-400" size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders, ref codes, users..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs dark:border-slate-700 dark:bg-slate-800 outline-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            {orders
              .filter(
                (o) =>
                  !searchQuery ||
                  o.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()),
              )
              .map((o) => (
                <div
                  key={o.id}
                  className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-orange-100 dark:bg-orange-950 px-2 py-0.5 text-xs font-mono font-bold text-savori-orange">
                        REF: #{o.order_number?.replace("ORD-", "")}
                      </span>
                      <span className="font-mono text-xs text-slate-400">{o.order_number}</span>
                      <span className="text-xs text-slate-400">• {new Date(o.created_at).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 font-bold text-sm text-slate-900 dark:text-slate-100">
                      Customer: {o.customer_name || "Guest"} ({o.customer_email || "N/A"})
                    </p>
                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                      <strong>Items: </strong>
                      {o.items?.map((it) => `${it.quantity}x ${it.menu_name}`).join(", ") || "No items"}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Total Charged</p>
                      <p className="text-lg font-black text-savori-brown dark:text-savori-cream">
                        KSh {Number(o.total).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`rounded-xl px-3 py-1 text-xs font-bold uppercase ${
                        o.status === "collected"
                          ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          : o.status === "ready"
                          ? "bg-emerald-100 text-emerald-800"
                          : o.status === "preparing"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : null}

      {/* TAB 4: USER ROLES & PERMISSIONS */}
      {activeTab === "users" ? (
        <div className="card-surface p-6 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                User Management & Access Privileges
              </h2>
              <p className="text-xs text-slate-500">
                Assign staff, administrator, or customer roles to platform members.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {["all", "customer", "staff", "admin"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleFilter(r)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize ${
                    roleFilter === r
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Loyalty Points</th>
                  <th className="py-3 px-4">Total Orders</th>
                  <th className="py-3 px-4">Total Spent</th>
                  <th className="py-3 px-4 text-right">Role Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users
                  .filter((u) => roleFilter === "all" || u.role === roleFilter)
                  .map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                            u.role === "admin"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                              : u.role === "staff"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-amber-600">
                        ⭐ {u.loyalty_points || 0} pts
                      </td>
                      <td className="py-3 px-4 font-bold">{u.order_count || 0}</td>
                      <td className="py-3 px-4 font-bold text-savori-brown dark:text-savori-cream">
                        KSh {Number(u.total_spent || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u.id, e.target.value)}
                          className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 outline-none"
                        >
                          <option value="customer">Customer</option>
                          <option value="staff">Kitchen Staff</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === "audit" ? (
        <div className="card-surface p-6 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Pricing Audit Trail & Regulatory Logs
            </h2>
            <p className="text-xs text-slate-500">
              Every price change is recorded with previous price, new price, staff actor, reason, and exact timestamp.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Dish</th>
                  <th className="py-3 px-4">Previous Price</th>
                  <th className="py-3 px-4">New Price</th>
                  <th className="py-3 px-4">Changed By</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.priceLogs?.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {log.item_name}
                    </td>
                    <td className="py-3 px-4 text-slate-500 line-through">
                      KSh {Number(log.old_price).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600">
                      KSh {Number(log.new_price).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-medium">{log.changed_by_name || "Admin"}</td>
                    <td className="py-3 px-4 text-xs italic text-slate-600 dark:text-slate-400">
                      {log.reason}
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-slate-400">
                      {new Date(log.changed_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
          {/* End of Active Tabs */}
        </main>
      </div>

      {/* ADD MEAL MODAL */}
      {isAddMealOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card-surface w-full max-w-lg p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setIsAddMealOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-1">
              Add New Dish to Savori Menu
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Item will be immediately available in the selected category and time window.
            </p>

            <form onSubmit={handleCreateMeal} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Dish Name
                </label>
                <input
                  type="text"
                  value={newMealForm.name}
                  onChange={(e) => setNewMealForm({ ...newMealForm, name: e.target.value })}
                  placeholder="e.g. Nyama Choma Deluxe"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  value={newMealForm.description}
                  onChange={(e) => setNewMealForm({ ...newMealForm, description: e.target.value })}
                  placeholder="Short appetizing description of ingredients and preparation..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none"
                  rows={2}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <select
                    value={newMealForm.category}
                    onChange={(e) => setNewMealForm({ ...newMealForm, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Price (KSh)
                  </label>
                  <input
                    type="number"
                    value={newMealForm.price}
                    onChange={(e) => setNewMealForm({ ...newMealForm, price: e.target.value })}
                    placeholder="e.g. 750"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    value={newMealForm.stockQuantity}
                    onChange={(e) => setNewMealForm({ ...newMealForm, stockQuantity: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Serving Start (24H)
                  </label>
                  <input
                    type="time"
                    value={newMealForm.startTime}
                    onChange={(e) => setNewMealForm({ ...newMealForm, startTime: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Serving End (24H)
                  </label>
                  <input
                    type="time"
                    value={newMealForm.endTime}
                    onChange={(e) => setNewMealForm({ ...newMealForm, endTime: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  value={newMealForm.image}
                  onChange={(e) => setNewMealForm({ ...newMealForm, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddMealOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-savori-orange py-2.5 text-xs font-bold text-white shadow-md hover:bg-savori-green transition-colors"
                >
                  Add Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* EDIT PRICE MODAL */}
      {editingMeal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card-surface w-full max-w-md p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setEditingMeal(null)}
              className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-1">
              Adjust Price: {editingMeal.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Current Price: <strong>KSh {editingMeal.price}</strong>
            </p>

            <form onSubmit={handleSavePrice} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  New Price (KSh)
                </label>
                <input
                  type="number"
                  value={editPriceForm.price}
                  onChange={(e) => setEditPriceForm({ ...editPriceForm, price: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Reason for Price Adjustment (Audit Trail)
                </label>
                <input
                  type="text"
                  value={editPriceForm.reason}
                  onChange={(e) => setEditPriceForm({ ...editPriceForm, reason: e.target.value })}
                  placeholder="e.g. Seasonal ingredient adjustment"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMeal(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-savori-orange py-2.5 text-xs font-bold text-white shadow-md hover:bg-savori-green transition-colors"
                >
                  Update & Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
