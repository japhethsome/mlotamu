import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
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
  Camera,
  CameraOff,
  SwitchCamera,
  Plus,
  Trash2,
  Image as ImageIcon,
  ClipboardList,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../lib/api.js";
import OfficialReceiptModal from "../components/OfficialReceiptModal.jsx";

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

const PRESET_DISH_IMAGES = [
  { label: "🍚 Rice", url: "https://images.unsplash.com/photo-1536304993881-ff86e0c9ef97?auto=format&fit=crop&w=900&q=80" },
  { label: "🫓 Chapati", url: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=80" },
  { label: "🥟 Ndazi", url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=900&q=80" },
  { label: "☕ Hot Tea", url: "https://images.unsplash.com/photo-1510627489930-0c1b0bfb6785?auto=format&fit=crop&w=900&q=80" },
  { label: "🥩 Stew / Beef", url: "https://images.unsplash.com/photo-1547928576-a4a33237cbc3?auto=format&fit=crop&w=900&q=80" },
  { label: "🥗 Veggies / Sukuma", url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80" },
  { label: "🍛 Beans / Githeri", url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80" },
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
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraFacing, setCameraFacing] = useState("environment");
  const html5QrCodeRef = useRef(null);

  // Add / Edit Meal Modal state
  const [editingMeal, setEditingMeal] = useState(null);
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [mealCategoryFilter, setMealCategoryFilter] = useState("all");
  const [mealSearchQuery, setMealSearchQuery] = useState("");
  const [mealForm, setMealForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "lunch",
    image: "",
    stockQuantity: "50",
    isAvailable: true,
    startTime: "11:00",
    endTime: "14:00",
    dietaryTags: "",
    allergens: "",
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

  useEffect(() => {
    const handleOpenAddMeal = () => {
      setActiveTab("inventory");
      openAddModal();
    };
    window.addEventListener("open-add-meal-modal", handleOpenAddMeal);

    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "add-meal") {
      setActiveTab("inventory");
      openAddModal();
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return () => window.removeEventListener("open-add-meal-modal", handleOpenAddMeal);
  }, []);

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

  // Open Add Meal Modal
  const openAddModal = () => {
    setIsAddingMeal(true);
    setEditingMeal(null);
    setMealForm({
      name: "",
      description: "",
      price: "",
      category: "lunch",
      image: "",
      stockQuantity: "50",
      isAvailable: true,
      startTime: "11:00",
      endTime: "14:00",
      dietaryTags: "",
      allergens: "",
    });
  };

  // Open Edit Meal Modal
  const openEditModal = (meal) => {
    setIsAddingMeal(false);
    setEditingMeal(meal);
    setMealForm({
      name: meal.name || "",
      description: meal.description || "",
      price: String(meal.price ?? ""),
      category: meal.category || "lunch",
      image: meal.image || "",
      stockQuantity: String(meal.stock_quantity ?? meal.stockQuantity ?? 50),
      isAvailable: meal.isAvailable !== false,
      startTime: meal.servingHours?.start || "06:00",
      endTime: meal.servingHours?.end || "20:00",
      dietaryTags: Array.isArray(meal.dietaryTags) ? meal.dietaryTags.join(", ") : "",
      allergens: Array.isArray(meal.allergens) ? meal.allergens.join(", ") : "",
    });
  };

  // Delete Meal from Menu
  const handleDeleteMeal = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}" from the menu? Customers will no longer be able to view or order this dish.`)) {
      return;
    }
    try {
      await apiRequest(`/menu/${item.id}`, { method: "DELETE" }, token);
      setMenuItems((prev) => prev.filter((m) => m.id !== item.id));
      alert(`"${item.name}" was successfully removed from the menu.`);
    } catch (err) {
      alert(err.message || "Failed to delete meal.");
    }
  };

  // Save Meal (Add new or Update existing)
  const handleSaveMeal = async (e) => {
    e.preventDefault();
    if (!mealForm.name.trim()) {
      alert("Please enter a meal name.");
      return;
    }
    const priceNum = Number(mealForm.price);
    if (!priceNum || priceNum <= 0) {
      alert("Please enter a valid price greater than 0.");
      return;
    }

    const payload = {
      name: mealForm.name.trim(),
      description: mealForm.description.trim() || `${mealForm.name.trim()} prepared fresh at Savori cafeteria.`,
      price: priceNum,
      category: mealForm.category,
      image: mealForm.image.trim() || "/logo.png",
      stockQuantity: Number(mealForm.stockQuantity || 0),
      isAvailable: !!mealForm.isAvailable,
      servingHours: {
        start: mealForm.startTime || "06:00",
        end: mealForm.endTime || "20:00",
      },
      dietaryTags: mealForm.dietaryTags
        ? mealForm.dietaryTags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      allergens: mealForm.allergens
        ? mealForm.allergens.split(",").map((a) => a.trim()).filter(Boolean)
        : [],
    };

    try {
      if (isAddingMeal) {
        const created = await apiRequest("/menu", {
          method: "POST",
          body: JSON.stringify(payload),
        }, token);
        setMenuItems((prev) => [...prev, created]);
        alert(`"${created.name}" has been added to the menu!`);
      } else if (editingMeal) {
        const updated = await apiRequest(`/menu/${editingMeal.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        }, token);
        setMenuItems((prev) => prev.map((m) => (m.id === editingMeal.id ? updated : m)));
        alert(`"${updated.name}" has been updated successfully!`);
      }

      setEditingMeal(null);
      setIsAddingMeal(false);
    } catch (err) {
      alert(err.message || "Failed to save meal item.");
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

  // Camera controls
  const stopCamera = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      }
    } catch (e) {
      console.debug("Camera stop log:", e);
    } finally {
      setCameraActive(false);
    }
  };

  const startCamera = async (facing = cameraFacing) => {
    setCameraError("");
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      }
      const element = document.getElementById("staff-camera-viewfinder");
      if (!element) return;

      const qrCode = new Html5Qrcode("staff-camera-viewfinder");
      html5QrCodeRef.current = qrCode;

      await qrCode.start(
        { facingMode: facing },
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          await handleVerifyCode(decodedText);
        },
        () => {}
      );
      setCameraActive(true);
    } catch (err) {
      console.error("Camera error:", err);
      setCameraActive(false);
      setCameraError(
        err?.message || "Unable to access device camera. Please grant camera permission or use the Reference Code input below."
      );
    }
  };

  const toggleCameraFacing = async () => {
    const nextFacing = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(nextFacing);
    if (cameraActive) {
      await startCamera(nextFacing);
    }
  };

  useEffect(() => {
    let timeoutId;
    if (activeTab === "scanner") {
      timeoutId = setTimeout(() => {
        startCamera();
      }, 300);
    } else {
      stopCamera();
    }
    return () => {
      clearTimeout(timeoutId);
      stopCamera();
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
              onClick={() => {
                setActiveTab("inventory");
                openAddModal();
              }}
              className="flex items-center gap-1.5 rounded-xl bg-savori-orange px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-savori-orange/30 hover:bg-savori-green hover:shadow-savori-green/30 transition-all transform active:scale-95"
              id="top-add-meal-btn"
            >
              <Plus size={15} /> + Add Meal to Menu
            </button>
            <Link
              to="/staff/summary"
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:from-amber-700 hover:to-orange-700 transition-all"
            >
              <ClipboardList size={14} /> Kitchen Prep Summary
            </Link>
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

      {/* Official Receipt Modal when Order is verified via QR or Ref Code */}
      {verifiedOrder && (
        <OfficialReceiptModal
          order={verifiedOrder}
          onClose={() => setVerifiedOrder(null)}
          onMarkCollected={handleMarkCollected}
          isStaff={true}
        />
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex flex-wrap gap-2">
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
            <Package size={16} /> Menu & Meal Catalog
          </button>
        </div>

        {/* Dedicated Add Meal Button in Tab Bar */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("inventory");
            openAddModal();
          }}
          className="flex items-center gap-2 rounded-xl bg-savori-orange px-4 py-2 text-xs sm:text-sm font-black text-white shadow-md shadow-savori-orange/30 hover:bg-savori-green hover:shadow-savori-green/30 transition-all transform active:scale-95 ml-auto"
          id="tab-bar-add-meal-btn"
        >
          <Plus size={16} /> + Add Meal to Menu
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
          <div className="card-surface p-6 border border-slate-200/80 dark:border-slate-800 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2 text-savori-brown dark:text-savori-cream">
                  <Camera size={24} className="text-savori-orange" /> Device Camera QR Scanner
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Point device camera at the customer's QR code on their phone to scan their official receipt.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {cameraActive ? (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="flex items-center gap-1.5 rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-rose-600 transition-colors"
                  >
                    <CameraOff size={14} /> Stop Camera
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                  >
                    <Camera size={14} /> Start Camera
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
                  title="Switch camera"
                >
                  <SwitchCamera size={14} /> Flip
                </button>
              </div>
            </div>

            {/* Viewfinder Container */}
            <div className="relative overflow-hidden rounded-2xl bg-black border-2 border-slate-800 aspect-square max-h-[360px] w-full mx-auto flex items-center justify-center shadow-inner">
              <div id="staff-camera-viewfinder" className="w-full h-full object-cover" />
              {cameraActive && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-60 w-60 rounded-3xl border-2 border-dashed border-savori-orange/80 shadow-[0_0_25px_rgba(249,115,22,0.4)] animate-pulse flex items-center justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-savori-orange bg-black/75 px-3 py-1 rounded-full">
                      Align QR Code Inside
                    </span>
                  </div>
                </div>
              )}
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-900/95">
                  <Camera size={44} className="mb-2 text-slate-500 opacity-60" />
                  <p className="text-sm font-bold text-slate-200">Device Camera is Inactive</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Click "Start Camera" above to activate device camera scanning.
                  </p>
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="mt-4 flex items-center gap-2 rounded-xl bg-savori-orange px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-savori-green transition-colors"
                  >
                    <Camera size={14} /> Turn On Camera
                  </button>
                </div>
              )}
            </div>

            {cameraError ? (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                <p className="font-bold">Camera Permission / Hardware Notice:</p>
                <p>{cameraError}</p>
              </div>
            ) : null}

            {/* Quick manual reference code fallback */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Manual Reference Code / Token Lookup:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
                  placeholder="Enter 8-digit Ref Code (e.g. 84920194)"
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm font-mono dark:border-slate-700 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-savori-orange/30"
                />
                <button
                  type="button"
                  onClick={() => handleVerifyCode()}
                  className="rounded-xl bg-savori-brown px-4 py-2 text-xs font-bold text-white hover:bg-savori-orange transition-colors"
                >
                  Verify Code
                </button>
              </div>
            </div>
          </div>

          <div className="card-surface p-6 border border-slate-200/80 dark:border-slate-800">
            <h2 className="text-xl font-bold mb-3">Kitchen Counter Instructions</h2>
            <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-savori-orange text-white text-xs font-bold">1</span>
                <div>
                  <strong className="text-slate-900 dark:text-slate-100 block">Customer Shows QR or Ref Code</strong>
                  <span className="text-xs text-slate-500">Customer presents their phone screen with the order QR code or 8-digit reference code.</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-savori-orange text-white text-xs font-bold">2</span>
                <div>
                  <strong className="text-slate-900 dark:text-slate-100 block">Official Receipt Appears Automatically</strong>
                  <span className="text-xs text-slate-500">Scanning immediately displays the full official receipt with payment confirmation (PAID VIA PHONE), itemized meals, quantities, and customer details.</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-savori-orange text-white text-xs font-bold">3</span>
                <div>
                  <strong className="text-slate-900 dark:text-slate-100 block">Hand Over & Mark Collected</strong>
                  <span className="text-xs text-slate-500">Pack the ordered meals and click "Mark as Handed Over / Collected" on the receipt to close the ticket and prevent duplicate collection.</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      ) : null}

      {/* TAB 4: MENU, STOCK & PRICE EDITOR */}
      {activeTab === "inventory" ? (
        <div className="card-surface p-6 border border-slate-200/80 dark:border-slate-800 space-y-6">
          {/* Header & Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <UtensilsCrossed className="text-savori-orange" size={24} />
                Menu Catalog & Meal Management
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Add new meals to the customer menu, edit dishes, adjust prices, or remove discontinued meals.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 rounded-xl bg-savori-orange px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-savori-orange/30 hover:bg-savori-green hover:shadow-savori-green/30 transition-all transform active:scale-95 shrink-0"
            >
              <Plus size={18} />
              + Add New Meal to Menu
            </button>
          </div>

          {/* Filter Bar: Search & Category Pills */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: "all", label: "All Items" },
                { key: "breakfast", label: "Breakfast" },
                { key: "lunch", label: "Lunch" },
                { key: "dinner", label: "Dinner" },
                { key: "supper", label: "Supper" },
              ].map((cat) => {
                const count = cat.key === "all" 
                  ? menuItems.length 
                  : menuItems.filter((m) => m.category === cat.key).length;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setMealCategoryFilter(cat.key)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      mealCategoryFilter === cat.key
                        ? "bg-savori-brown text-white shadow-sm dark:bg-savori-orange"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className="rounded-full bg-white/20 dark:bg-black/20 px-1.5 py-0.2 text-[10px]">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative md:w-72">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                value={mealSearchQuery}
                onChange={(e) => setMealSearchQuery(e.target.value)}
                placeholder="Search dishes by name or ingredient..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-savori-orange focus:ring-2 focus:ring-savori-orange/20 dark:border-slate-700 dark:bg-slate-800"
              />
              {mealSearchQuery ? (
                <button
                  type="button"
                  onClick={() => setMealSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>
          </div>

          {/* Menu Items Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4">Dish</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Serving Window</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {menuItems
                  .filter((item) => {
                    const matchesCategory =
                      mealCategoryFilter === "all"
                        ? true
                        : item.category === mealCategoryFilter ||
                          (mealCategoryFilter === "dinner" && item.category === "supper");
                    const matchesSearch =
                      !mealSearchQuery ||
                      item.name?.toLowerCase().includes(mealSearchQuery.toLowerCase()) ||
                      item.description?.toLowerCase().includes(mealSearchQuery.toLowerCase());
                    return matchesCategory && matchesSearch;
                  })
                  .map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image || "/logo.png"}
                            alt={item.name}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "/logo.png";
                            }}
                            className="h-11 w-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {item.name}
                            </span>
                            {item.description ? (
                              <span className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                                {item.description}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block rounded-lg px-2.5 py-1 text-xs font-extrabold capitalize ${
                            item.category === "breakfast"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
                              : item.category === "lunch"
                              ? "bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300"
                              : item.category === "dinner"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300"
                              : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300"
                          }`}
                        >
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {item.servingHours?.start || "06:00"} - {item.servingHours?.end || "20:00"}
                      </td>
                      <td className="py-3 px-4 font-black text-savori-brown dark:text-savori-cream whitespace-nowrap">
                        KSh {Number(item.price).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold ${
                            (item.stock_quantity ?? item.stockQuantity ?? 0) <= 5
                              ? "text-rose-600 dark:text-rose-400"
                              : (item.stock_quantity ?? item.stockQuantity ?? 0) <= 15
                              ? "text-amber-600 dark:text-amber-400"
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
                          className={`rounded-full px-2.5 py-1 text-xs font-bold transition-transform active:scale-95 ${
                            item.isAvailable
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {item.isAvailable ? "Available" : "Sold Out"}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-savori-brown dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                            title="Edit meal"
                          >
                            <Edit3 size={13} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMeal(item)}
                            className="flex items-center gap-1 rounded-xl border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete meal"
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {/* Empty filter result */}
            {menuItems.filter((item) => {
              const matchesCategory =
                mealCategoryFilter === "all"
                  ? true
                  : item.category === mealCategoryFilter ||
                    (mealCategoryFilter === "dinner" && item.category === "supper");
              const matchesSearch =
                !mealSearchQuery ||
                item.name?.toLowerCase().includes(mealSearchQuery.toLowerCase()) ||
                item.description?.toLowerCase().includes(mealSearchQuery.toLowerCase());
              return matchesCategory && matchesSearch;
            }).length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <UtensilsCrossed size={36} className="mx-auto mb-2 opacity-50" />
                <p className="font-bold text-slate-600 dark:text-slate-300">No dishes found</p>
                <p className="text-xs text-slate-400 mt-1">
                  Try adjusting your search query or click "+ Add New Meal to Menu" above to add this dish.
                </p>
                <button
                  type="button"
                  onClick={openAddModal}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-savori-orange px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-savori-green transition-colors"
                >
                  <Plus size={14} /> Add New Meal
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ADD / EDIT MEAL MODAL */}
      {(editingMeal || isAddingMeal) ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="card-surface w-full max-w-xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative animate-in fade-in zoom-in-95 my-8">
            <button
              type="button"
              onClick={() => {
                setEditingMeal(null);
                setIsAddingMeal(false);
              }}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="mb-4">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {isAddingMeal ? (
                  <>
                    <Plus className="text-savori-orange" size={22} />
                    Add New Meal to Menu
                  </>
                ) : (
                  <>
                    <Edit3 className="text-savori-orange" size={22} />
                    Edit Meal: {editingMeal.name}
                  </>
                )}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isAddingMeal
                  ? "Enter the dish details below. Placeholders provide examples for each field."
                  : `Update pricing, descriptions, serving hours, or image for this dish.`}
              </p>
            </div>

            <form onSubmit={handleSaveMeal} className="space-y-4">
              {/* Row 1: Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Meal / Dish Name *
                  </label>
                  <input
                    type="text"
                    value={mealForm.name}
                    onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })}
                    placeholder="e.g. Traditional Ugali & Sukuma Wiki"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-savori-orange/30 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Meal Category *
                  </label>
                  <select
                    value={mealForm.category}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      let start = "11:00", end = "14:00";
                      if (newCat === "breakfast") { start = "06:00"; end = "09:00"; }
                      else if (newCat === "lunch") { start = "11:00"; end = "14:00"; }
                      else if (newCat === "dinner") { start = "16:00"; end = "20:00"; }
                      else if (newCat === "supper") { start = "20:00"; end = "23:00"; }
                      setMealForm({
                        ...mealForm,
                        category: newCat,
                        startTime: start,
                        endTime: end,
                      });
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-savori-orange/30 font-semibold"
                  >
                    <option value="breakfast">Breakfast (06:00 – 09:00)</option>
                    <option value="lunch">Lunch (11:00 – 14:00)</option>
                    <option value="dinner">Dinner (16:00 – 20:00)</option>
                    <option value="supper">Supper (Late Night)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Price & Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Price (KSh) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={mealForm.price}
                    onChange={(e) => setMealForm({ ...mealForm, price: e.target.value })}
                    placeholder="e.g. 150"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-savori-orange/30 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={mealForm.stockQuantity}
                    onChange={(e) => setMealForm({ ...mealForm, stockQuantity: e.target.value })}
                    placeholder="e.g. 50"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-savori-orange/30 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Dish Description & Ingredients
                </label>
                <textarea
                  rows={2}
                  value={mealForm.description}
                  onChange={(e) => setMealForm({ ...mealForm, description: e.target.value })}
                  placeholder="e.g. Freshly stone-ground maize flour ugali accompanied by sautéed collard greens, sweet onions, and house spices."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-savori-orange/30"
                />
              </div>

              {/* Image URL & Preset Selection */}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Meal Image (URL or relative path)
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={mealForm.image}
                    onChange={(e) => setMealForm({ ...mealForm, image: e.target.value })}
                    placeholder="e.g. https://images.unsplash.com/... (or pick a preset below)"
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-savori-orange/30"
                  />
                  {mealForm.image ? (
                    <img
                      src={mealForm.image}
                      alt="Preview"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/logo.png";
                      }}
                      className="h-10 w-10 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : null}
                </div>

                {/* Quick Presets */}
                <div className="mt-2">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Quick image presets (click to apply photo):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_DISH_IMAGES.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setMealForm({ ...mealForm, image: preset.url })}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                          mealForm.image === preset.url
                            ? "border-savori-orange bg-orange-50 text-savori-orange dark:bg-orange-950/60"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Serving Window Hours */}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Serving Window Hours (24-Hour format)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400">Start Time:</span>
                    <input
                      type="time"
                      value={mealForm.startTime}
                      onChange={(e) => setMealForm({ ...mealForm, startTime: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none font-mono"
                      required
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">End Time:</span>
                    <input
                      type="time"
                      value={mealForm.endTime}
                      onChange={(e) => setMealForm({ ...mealForm, endTime: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Tags & Allergens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Dietary Tags
                  </label>
                  <input
                    type="text"
                    value={mealForm.dietaryTags}
                    onChange={(e) => setMealForm({ ...mealForm, dietaryTags: e.target.value })}
                    placeholder="e.g. Vegetarian, Halal, Gluten-Free"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Allergens
                  </label>
                  <input
                    type="text"
                    value={mealForm.allergens}
                    onChange={(e) => setMealForm({ ...mealForm, allergens: e.target.value })}
                    placeholder="e.g. Dairy, Gluten, Nuts"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 outline-none"
                  />
                </div>
              </div>

              {/* Availability Checkbox */}
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="mealAvailableCheck"
                  checked={mealForm.isAvailable}
                  onChange={(e) => setMealForm({ ...mealForm, isAvailable: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-savori-orange focus:ring-savori-orange"
                />
                <label htmlFor="mealAvailableCheck" className="text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                  Dish is actively available for customer ordering
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingMeal(null);
                    setIsAddingMeal(false);
                  }}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-savori-orange py-2.5 text-xs font-bold text-white shadow-md hover:bg-savori-green transition-all"
                >
                  {isAddingMeal ? "+ Add Meal to Menu" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
