import { useEffect, useState, useRef } from "react";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  QrCode,
  UtensilsCrossed,
  Layers,
  ChefHat,
  RefreshCw,
  Sun,
  Sunset,
  Moon,
  ChevronRight,
  Package,
  Edit3,
  X,
  User,
  Hash,
  Sparkles,
} from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../lib/api.js";

const MEAL_CATEGORIES = [
  {
    key: "breakfast",
    name: "Breakfast Service",
    hours: "06:00 – 09:00",
    icon: Sun,
    color: "from-amber-500 to-orange-500",
  },
  {
    key: "lunch",
    name: "Lunch Service",
    hours: "11:00 – 14:00",
    icon: UtensilsCrossed,
    color: "from-orange-500 to-rose-500",
  },
  {
    key: "dinner",
    name: "Dinner Service",
    hours: "16:00 – 20:00",
    icon: Moon,
    color: "from-indigo-600 to-purple-700",
  },
];

export default function StaffDashboardPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("orders"); // "orders", "meals", "scanner", "inventory"
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mealFilter, setMealFilter] = useState("all"); // "all", "breakfast", "lunch", "dinner"
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Verification & Scanning state
  const [verifyCode, setVerifyCode] = useState("");
  const [verifiedOrder, setVerifiedOrder] = useState(null);
  const [verifyMessage, setVerifyMessage] = useState({ text: "", type: "" });
  const [scannerActive, setScannerActive] = useState(false);
  const scannerRef = useRef(null);

  // Edit Meal Modal state
  const [editingMeal, setEditingMeal] = useState(null);
  const [mealForm, setMealForm] = useState({
    name: "",
    price: "",
    stockQuantity: "",
    isAvailable: true,
    startTime: "06:00",
    endTime: "09:00",
  });

  const fetchData = async () => {
    if (!token) return;
    try {
      setRefreshing(true);
      const [ordersData, menuData] = await Promise.all([
        apiRequest("/orders", {}, token),
        apiRequest("/menu", {}, token),
      ]);
      setOrders(ordersData || []);
      setMenuItems(menuData || []);
    } catch (err) {
      console.error("Error fetching staff dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Poll every 15s for live cafeteria updates
    return () => clearInterval(interval);
  }, [token]);

  // Update order status
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await apiRequest(
        `/orders/${orderId}/status`,
        { method: "PATCH", body: JSON.stringify({ status: newStatus }) },
        token,
      );
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
      if (verifiedOrder && verifiedOrder.id === orderId) {
        setVerifiedOrder((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert(err.message || "Failed to update order status.");
    }
  };

  // Mark collected
  const handleMarkCollected = async (orderId, tokenOrNumber) => {
    try {
      await apiRequest(
        "/orders/collect",
        { method: "POST", body: JSON.stringify({ orderId, token: tokenOrNumber }) },
        token,
      );
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "collected" } : o)),
      );
      if (verifiedOrder && verifiedOrder.id === orderId) {
        setVerifiedOrder((prev) => ({ ...prev, status: "collected" }));
      }
      setVerifyMessage({ text: "Order marked as collected!", type: "success" });
    } catch (err) {
      setVerifyMessage({ text: err.message || "Failed to mark as collected.", type: "error" });
    }
  };

  // Toggle whole meal category open/closed
  const handleToggleCategory = async (category, currentlyOpen) => {
    const newStatus = !currentlyOpen;
    try {
      await apiRequest(
        "/menu/category-toggle",
        {
          method: "POST",
          body: JSON.stringify({ category, isAvailable: newStatus }),
        },
        token,
      );
      setMenuItems((prev) =>
        prev.map((item) => {
          const match =
            item.category === category ||
            ((category === "dinner" || category === "supper") &&
              (item.category === "dinner" || item.category === "supper"));
          return match ? { ...item, isAvailable: newStatus } : item;
        }),
      );
    } catch (err) {
      alert(err.message || "Failed to toggle category availability.");
    }
  };

  // Toggle single meal availability
  const handleToggleItemAvailability = async (item) => {
    const updatedStatus = !item.isAvailable;
    try {
      await apiRequest(
        `/menu/${item.id}/availability`,
        {
          method: "PATCH",
          body: JSON.stringify({ isAvailable: updatedStatus }),
        },
        token,
      );
      setMenuItems((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, isAvailable: updatedStatus } : m)),
      );
    } catch (err) {
      alert(err.message || "Failed to toggle meal availability.");
    }
  };

  // Open Edit Meal Modal
  const openEditModal = (meal) => {
    setEditingMeal(meal);
    setMealForm({
      name: meal.name,
      price: meal.price,
      stockQuantity: meal.stock_quantity ?? meal.stockQuantity ?? 0,
      isAvailable: meal.isAvailable,
      startTime: meal.servingHours?.start || "06:00",
      endTime: meal.servingHours?.end || "20:00",
    });
  };

  // Save Meal Edit
  const handleSaveMeal = async (e) => {
    e.preventDefault();
    if (!editingMeal) return;

    try {
      // Update Price if changed
      if (Number(mealForm.price) !== Number(editingMeal.price)) {
        await apiRequest(
          `/menu/${editingMeal.id}/price`,
          {
            method: "PATCH",
            body: JSON.stringify({
              newPrice: Number(mealForm.price),
              reason: "Staff dashboard adjustment",
            }),
          },
          token,
        );
      }

      // Update Serving Hours
      await apiRequest(
        `/menu/${editingMeal.id}/serving-hours`,
        {
          method: "PATCH",
          body: JSON.stringify({
            start: mealForm.startTime,
            end: mealForm.endTime,
          }),
        },
        token,
      );

      // Update Stock
      await apiRequest(
        `/menu/${editingMeal.id}/stock`,
        {
          method: "PATCH",
          body: JSON.stringify({ stockQuantity: Number(mealForm.stockQuantity) }),
        },
        token,
      );

      // Update Availability
      await apiRequest(
        `/menu/${editingMeal.id}/availability`,
        {
          method: "PATCH",
          body: JSON.stringify({ isAvailable: mealForm.isAvailable }),
        },
        token,
      );

      setMenuItems((prev) =>
        prev.map((m) =>
          m.id === editingMeal.id
            ? {
                ...m,
                price: Number(mealForm.price),
                stock_quantity: Number(mealForm.stockQuantity),
                isAvailable: mealForm.isAvailable,
                servingHours: { start: mealForm.startTime, end: mealForm.endTime },
              }
            : m,
        ),
      );

      setEditingMeal(null);
    } catch (err) {
      alert(err.message || "Failed to update meal.");
    }
  };

  // Verify order by code or QR text
  const handleVerifyCode = async (codeToVerify) => {
    const query = (codeToVerify || verifyCode).trim();
    if (!query) return;
    setVerifyMessage({ text: "Verifying...", type: "info" });
    try {
      const response = await apiRequest(
        "/orders/verify-qr",
        { method: "POST", body: JSON.stringify({ token: query }) },
        token,
      );
      setVerifiedOrder(response.order);
      setVerifyMessage({ text: "Order verified successfully!", type: "success" });
    } catch (err) {
      setVerifiedOrder(null);
      setVerifyMessage({
        text: err.message || "No order found for this reference code or QR token.",
        type: "error",
      });
    }
  };

  // Camera QR scanner integration
  useEffect(() => {
    if (activeTab === "scanner" && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        "staff-qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false,
      );

      scanner.render(
        async (decodedText) => {
          handleVerifyCode(decodedText);
        },
        (err) => console.debug(err),
      );

      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [activeTab]);

  // Helper: does this order contain items from a given meal category?
  const orderHasMeal = (order, category) => {
    if (category === "all") return true;
    return order.items?.some((i) => {
      const cat = (i.item_category || "").toLowerCase();
      // treat "supper" as dinner
      if (category === "dinner") return cat === "dinner" || cat === "supper";
      return cat === category;
    });
  };

  // Derive primary meal label for an order (for the badge)
  const getPrimaryMeal = (order) => {
    const categories = (order.items || []).map((i) =>
      (i.item_category || "").toLowerCase() === "supper" ? "dinner" : (i.item_category || "").toLowerCase()
    );
    const priority = ["breakfast", "lunch", "dinner"];
    return priority.find((c) => categories.includes(c)) || "other";
  };

  const MEAL_BADGE_COLORS = {
    breakfast: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    lunch: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
    dinner: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
    other: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  };

  // Filtering orders
  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === "all" ? true : order.status === statusFilter;
    const matchesMeal = orderHasMeal(order, mealFilter);
    const matchesQuery =
      !searchQuery ||
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items?.some((i) =>
        i.menu_name?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    return matchesStatus && matchesMeal && matchesQuery;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "received":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
      case "preparing":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800";
      case "ready":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
      case "collected":
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
      default:
        return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Fast Verification Bar */}
      <div className="card-surface p-6 shadow-xl border border-slate-200/80 dark:border-savori-brownLight/40">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-savori-orange to-amber-600 text-white shadow-lg shadow-savori-orange/30">
              <ChefHat size={30} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-savori-brown dark:text-savori-cream">
                Kitchen Operations Hub
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Live cafeteria orders, line item fulfillment & meal service management
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={fetchData}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin text-savori-orange" : ""} />
              {refreshing ? "Syncing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Quick Reference Code & QR Lookup Bar */}
        <div className="mt-5 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-emerald-50 dark:from-slate-900 dark:to-savori-brown/40 p-4 border border-orange-200/60 dark:border-savori-brownLight/50">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-savori-brown dark:text-savori-cream">
            ⚡ Quick Reference Code or QR Token Lookup
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Hash className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
                placeholder="Enter 8-digit Reference Code (e.g. 84920194) or full Order # / QR token"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-mono shadow-sm outline-none focus:border-savori-orange focus:ring-2 focus:ring-savori-orange/20 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <button
              type="button"
              onClick={() => handleVerifyCode()}
              className="flex items-center justify-center gap-2 rounded-xl bg-savori-orange px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-savori-orange/30 hover:bg-savori-green transition-colors"
            >
              <Search size={16} /> Check Order
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("scanner")}
              className="flex items-center justify-center gap-2 rounded-xl border border-savori-brown/20 bg-white px-4 py-2.5 text-sm font-bold text-savori-brown dark:bg-slate-800 dark:text-savori-cream hover:bg-slate-50 transition-colors"
            >
              <QrCode size={16} /> Open Camera QR Scanner
            </button>
          </div>

          {verifyMessage.text ? (
            <p
              className={`mt-2 text-xs font-semibold ${
                verifyMessage.type === "success"
                  ? "text-emerald-700 dark:text-emerald-400"
                  : verifyMessage.type === "error"
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-amber-700"
              }`}
            >
              {verifyMessage.text}
            </p>
          ) : null}
        </div>
      </div>

      {/* Verified Order Modal / Panel */}
      {verifiedOrder ? (
        <div className="card-surface p-6 border-2 border-emerald-500/60 shadow-2xl relative animate-in fade-in zoom-in-95">
          <button
            type="button"
            onClick={() => setVerifiedOrder(null)}
            className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Verified Order
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                Ref Code: #{verifiedOrder.order_number?.replace("ORD-", "")} ({verifiedOrder.order_number})
              </h2>
              <p className="text-xs text-slate-500">
                Customer: <strong>{verifiedOrder.customer_name || "Guest"}</strong> ({verifiedOrder.customer_email || "N/A"})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-xl px-3 py-1 text-xs font-bold uppercase border ${getStatusBadge(verifiedOrder.status)}`}>
                {verifiedOrder.status}
              </span>
              <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Total: KSh {Number(verifiedOrder.total || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Line items of verified order */}
          <div className="mt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Items Ordered ({verifiedOrder.items?.length || 0}):
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200/80 bg-white/50 dark:border-slate-800 dark:bg-slate-900/50">
              {verifiedOrder.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 text-sm">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {item.quantity}x {item.menu_name}
                    </span>
                    {item.notes ? (
                      <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                        Note: "{item.notes}"
                      </p>
                    ) : null}
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    KSh {(Number(item.unit_price) * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 justify-end">
            {verifiedOrder.status !== "collected" ? (
              <button
                type="button"
                onClick={() => handleMarkCollected(verifiedOrder.id, verifiedOrder.qr_token || verifiedOrder.order_number)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 font-bold text-sm text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle2 size={18} /> Mark as Handed Over / Collected
              </button>
            ) : (
              <span className="flex items-center gap-1 text-sm font-bold text-slate-500">
                <CheckCircle2 size={16} /> Order has been collected
              </span>
            )}
          </div>
        </div>
      ) : null}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
            activeTab === "orders"
              ? "bg-savori-brown text-white shadow-md dark:bg-savori-orange"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          <Layers size={16} /> Live Orders Queue
          <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">
            {orders.filter((o) => o.status !== "collected" && o.status !== "cancelled").length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("meals")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
            activeTab === "meals"
              ? "bg-savori-brown text-white shadow-md dark:bg-savori-orange"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          <Clock size={16} /> Meal Service Windows & Availability
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("scanner")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
            activeTab === "scanner"
              ? "bg-savori-brown text-white shadow-md dark:bg-savori-orange"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          <QrCode size={16} /> QR Camera Scanner
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("inventory")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
            activeTab === "inventory"
              ? "bg-savori-brown text-white shadow-md dark:bg-savori-orange"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          <Package size={16} /> Menu & Price Editor
        </button>
      </div>

      {/* TAB 1: LIVE ORDERS QUEUE */}
      {activeTab === "orders" ? (
        <div className="space-y-4">
          {/* Status KPI Summary Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { status: "received", label: "Received", color: "text-amber-600" },
              { status: "preparing", label: "Preparing", color: "text-blue-600" },
              { status: "ready", label: "Ready for Pickup", color: "text-emerald-600" },
              { status: "collected", label: "Completed", color: "text-slate-600" },
            ].map((st) => (
              <button
                key={st.status}
                type="button"
                onClick={() => setStatusFilter(statusFilter === st.status ? "all" : st.status)}
                className={`card-surface p-4 text-left border transition-all ${
                  statusFilter === st.status
                    ? "ring-2 ring-savori-orange shadow-lg border-savori-orange"
                    : "hover:border-slate-300"
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {st.label}
                </p>
                <p className={`mt-1 text-2xl font-black ${st.color}`}>
                  {orders.filter((o) => o.status === st.status).length}
                </p>
              </button>
            ))}
          </div>

          {/* Meal Category Tabs */}
          <div className="card-surface border border-slate-200 dark:border-slate-800 p-3 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1">Filter by Meal Service</p>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "All Meals", icon: "🍽️" },
                { key: "breakfast", label: "Breakfast", icon: "☕" },
                { key: "lunch", label: "Lunch", icon: "🥗" },
                { key: "dinner", label: "Dinner", icon: "🍛" },
              ].map(({ key, label, icon }) => {
                const count = key === "all"
                  ? orders.filter((o) => o.status !== "collected" && o.status !== "cancelled").length
                  : orders.filter((o) => orderHasMeal(o, key) && o.status !== "collected" && o.status !== "cancelled").length;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMealFilter(key)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all border ${
                      mealFilter === key
                        ? "bg-savori-brown text-white border-savori-brown shadow-md dark:bg-savori-orange dark:border-savori-orange"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    <span>{icon}</span>
                    {label}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-black ${
                      mealFilter === key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & Status Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-3 text-slate-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by order #, ref code, customer, or meal..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {["all", "received", "preparing", "ready", "collected"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                    statusFilter === st
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {filteredOrders.length === 0 ? (
              <div className="card-surface col-span-2 p-12 text-center text-slate-500">
                <UtensilsCrossed size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-base font-semibold">No orders match current filter.</p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const refCode = order.order_number?.replace("ORD-", "") || order.id;
                return (
                  <div
                    key={order.id}
                    className="card-surface p-5 flex flex-col justify-between border border-slate-200/90 dark:border-slate-800 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <div>
                      {/* Order Header with Ref Code */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="rounded-lg bg-orange-100 px-2.5 py-0.5 font-mono text-xs font-bold text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                              REF: #{refCode}
                            </span>
                            {/* Meal category badge */}
                            <span className={`rounded-lg px-2.5 py-0.5 text-xs font-bold capitalize ${MEAL_BADGE_COLORS[getPrimaryMeal(order)]}`}>
                              {getPrimaryMeal(order) === "other" ? "Mixed" : getPrimaryMeal(order)}
                            </span>
                          </div>
                          <p className="mt-1 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <User size={14} className="text-slate-400" />
                            {order.customer_name || "Customer"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(order.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })} • Payment: {order.payment_method} ({order.payment_status})
                          </p>
                        </div>
                        <span
                          className={`rounded-xl px-2.5 py-1 text-xs font-bold uppercase border ${getStatusBadge(
                            order.status,
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>

                      {/* Products Ordered (Line Items) */}
                      <div className="mt-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                          Products Ordered:
                        </p>
                        <ul className="space-y-1.5 bg-slate-50/60 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                          {order.items?.map((item) => (
                            <li
                              key={item.id}
                              className="flex items-start justify-between text-xs text-slate-800 dark:text-slate-200"
                            >
                              <div>
                                <span className="font-bold text-savori-brown dark:text-savori-cream">
                                  {item.quantity}x
                                </span>{" "}
                                <span>{item.menu_name}</span>
                                {item.notes ? (
                                  <p className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                                    "{item.notes}"
                                  </p>
                                ) : null}
                              </div>
                              <span className="font-semibold text-slate-600 dark:text-slate-400">
                                KSh {(Number(item.unit_price) * item.quantity).toLocaleString()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Total & Action Controls */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-slate-500">Total Charged:</span>
                        <span className="text-base font-black text-savori-brown dark:text-savori-cream">
                          KSh {Number(order.total).toLocaleString()}
                        </span>
                      </div>

                      {/* Status Flow Buttons */}
                      <div className="flex flex-wrap gap-1.5">
                        {order.status === "received" ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(order.id, "preparing")}
                            className="flex-1 rounded-xl bg-blue-600 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                          >
                            Mark Preparing
                          </button>
                        ) : null}

                        {order.status === "preparing" ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(order.id, "ready")}
                            className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                          >
                            Mark Ready for Pickup
                          </button>
                        ) : null}

                        {order.status === "ready" ? (
                          <button
                            type="button"
                            onClick={() => handleMarkCollected(order.id, order.qr_token || order.order_number)}
                            className="flex-1 rounded-xl bg-savori-orange py-2 text-xs font-bold text-white shadow-md hover:bg-savori-green"
                          >
                            Mark Handed Over / Collected
                          </button>
                        ) : null}

                        {order.status === "collected" ? (
                          <span className="text-xs font-semibold text-slate-400 py-1">
                            ✓ Handed to customer
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}

      {/* TAB 2: MEAL SERVICE WINDOWS & CATEGORY AVAILABILITY */}
      {activeTab === "meals" ? (
        <div className="space-y-6">
          <div className="card-surface p-5 border border-slate-200/80 dark:border-savori-brownLight/50">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              Meal Category Service Windows
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Open or close meal services with one click. When closed, customers cannot place orders for meals in that category.
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              {MEAL_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const itemsInCat = menuItems.filter(
                  (m) =>
                    m.category === cat.key ||
                    ((cat.key === "dinner" || cat.key === "supper") &&
                      (m.category === "dinner" || m.category === "supper")),
                );
                const isOpen = itemsInCat.length > 0 && itemsInCat.some((m) => m.isAvailable);

                return (
                  <div
                    key={cat.key}
                    className="card-surface p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${cat.color} text-white shadow-md`}
                        >
                          <Icon size={24} />
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                            isOpen
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {isOpen ? "Active / Open" : "Closed"}
                        </span>
                      </div>

                      <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Serving window: <strong>{cat.hours}</strong>
                      </p>
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                        {itemsInCat.length} dishes configured • {itemsInCat.filter((i) => i.isAvailable).length} currently available
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleToggleCategory(cat.key, isOpen)}
                        className={`w-full rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
                          isOpen
                            ? "bg-rose-600 text-white hover:bg-rose-700"
                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                      >
                        {isOpen ? `Close ${cat.name}` : `Open ${cat.name}`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Meals List within Services */}
          <div className="card-surface p-5 border border-slate-200/80 dark:border-slate-800">
            <h3 className="text-lg font-bold mb-4">Dishes by Category & Hours</h3>
            <div className="space-y-3">
              {menuItems.map((meal) => (
                <div
                  key={meal.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={meal.image || "/logo.png"}
                      alt={meal.name}
                      className="h-12 w-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {meal.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        <span className="capitalize font-semibold">{meal.category}</span> • Serving Hours:{" "}
                        <strong>
                          {meal.servingHours?.start || "06:00"} - {meal.servingHours?.end || "20:00"}
                        </strong>{" "}
                        • Stock: {meal.stock_quantity ?? meal.stockQuantity ?? 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleItemAvailability(meal)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold uppercase ${
                        meal.isAvailable
                          ? "bg-emerald-100 text-emerald-800 hover:bg-rose-100 hover:text-rose-800"
                          : "bg-rose-100 text-rose-800 hover:bg-emerald-100 hover:text-emerald-800"
                      }`}
                    >
                      {meal.isAvailable ? "Available" : "Sold Out / Closed"}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(meal)}
                      className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Edit3 size={14} /> Edit Hours & Price
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* TAB 3: QR CAMERA SCANNER */}
      {activeTab === "scanner" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card-surface p-6 border border-slate-200/80 dark:border-slate-800">
            <h2 className="text-2xl font-bold mb-1 flex items-center gap-2 text-savori-brown dark:text-savori-cream">
              <QrCode size={24} /> Camera QR Ticket Scanner
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Hold the customer's digital order QR code up to your device camera to instantly view and confirm line items.
            </p>

            <div id="staff-qr-reader" className="min-h-[300px] rounded-2xl bg-slate-100 dark:bg-slate-900 overflow-hidden" />
          </div>

          <div className="card-surface p-6 border border-slate-200/80 dark:border-slate-800">
            <h2 className="text-xl font-bold mb-2">Instructions for Kitchen Counter</h2>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-savori-orange text-white text-xs font-bold">1</span>
                <span>Customer displays their order QR code or 8-digit pickup reference code on their phone.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-savori-orange text-white text-xs font-bold">2</span>
                <span>The system verifies the ticket validity, shows what products they ordered, and payment confirmation.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-savori-orange text-white text-xs font-bold">3</span>
                <span>Click "Mark as Handed Over / Collected" to finalize the ticket and prevent duplicate claims.</span>
              </li>
            </ul>
          </div>
        </div>
      ) : null}

      {/* TAB 4: MENU, STOCK & PRICE EDITOR */}
      {activeTab === "inventory" ? (
        <div className="card-surface p-6 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Menu Items, Serving Times & Stock Management
              </h2>
              <p className="text-xs text-slate-500">
                Quickly adjust prices (KSh), stock counts, serving windows, or toggle items on/off.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Serving Window</th>
                  <th className="py-3 px-4">Price (KSh)</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {menuItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image || "/logo.png"}
                          alt={item.name}
                          className="h-10 w-10 rounded-xl object-cover border"
                        />
                        <span className="font-bold text-slate-900 dark:text-slate-100">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 capitalize font-semibold text-slate-600 dark:text-slate-400">
                      {item.category}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      {item.servingHours?.start || "06:00"} - {item.servingHours?.end || "20:00"}
                    </td>
                    <td className="py-3 px-4 font-bold text-savori-brown dark:text-savori-cream">
                      KSh {Number(item.price).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          (item.stock_quantity ?? item.stockQuantity ?? 0) < 10
                            ? "text-rose-600 dark:text-rose-400 font-bold"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {item.stock_quantity ?? item.stockQuantity ?? 0}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleItemAvailability(item)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          item.isAvailable
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {item.isAvailable ? "Available" : "Sold Out"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* EDIT MEAL MODAL */}
      {editingMeal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card-surface w-full max-w-lg p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setEditingMeal(null)}
              className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-1">
              Edit {editingMeal.name}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Category: <span className="capitalize font-bold">{editingMeal.category}</span>
            </p>

            <form onSubmit={handleSaveMeal} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Price (KSh)
                  </label>
                  <input
                    type="number"
                    value={mealForm.price}
                    onChange={(e) => setMealForm({ ...mealForm, price: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={mealForm.stockQuantity}
                    onChange={(e) => setMealForm({ ...mealForm, stockQuantity: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Serving Window Hours (24H format)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400">Start Time:</span>
                    <input
                      type="time"
                      value={mealForm.startTime}
                      onChange={(e) => setMealForm({ ...mealForm, startTime: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">End Time:</span>
                    <input
                      type="time"
                      value={mealForm.endTime}
                      onChange={(e) => setMealForm({ ...mealForm, endTime: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="mealAvailableCheck"
                  checked={mealForm.isAvailable}
                  onChange={(e) => setMealForm({ ...mealForm, isAvailable: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-savori-orange focus:ring-savori-orange"
                />
                <label htmlFor="mealAvailableCheck" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Dish is actively available for ordering
                </label>
              </div>

              <div className="flex gap-2 pt-3">
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
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
