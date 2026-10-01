import { useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Home,
  ShoppingBag,
  ShoppingCart,
  Coffee,
  Salad,
  Utensils,
  ChefHat,
  ClipboardList,
  QrCode,
  PlusCircle,
  BarChart2,
  Moon,
  SunMedium,
  LogOut,
  LogIn,
  User,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

const MEAL_CATEGORIES = [
  {
    key: "breakfast",
    label: "Breakfast",
    hours: "06:00 – 09:00",
    icon: Coffee,
    color: "from-amber-500 to-orange-500",
    badgeBg: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300",
  },
  {
    key: "lunch",
    label: "Lunch",
    hours: "11:00 – 14:00",
    icon: Salad,
    color: "from-emerald-500 to-teal-500",
    badgeBg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300",
  },
  {
    key: "dinner",
    label: "Dinner",
    hours: "16:00 – 20:00",
    icon: Utensils,
    color: "from-indigo-500 to-purple-500",
    badgeBg: "bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300",
  },
];

export default function MobileSidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Close sidebar on route change
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  // Prevent background scrolling when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const navItemClass = ({ isActive }) =>
    `flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
      isActive
        ? "bg-savori-orange text-white shadow-md shadow-savori-orange/25"
        : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
    }`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Sidebar */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed left-0 top-0 bottom-0 z-50 flex h-full w-[84%] max-w-[320px] flex-col border-r border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Top Branding & Close Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4">
              <Link to="/" onClick={onClose} className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-savori-brown border border-savori-yellow/30 shadow-md overflow-hidden">
                  <img src="/logo.png" alt="Savori Logo" className="h-full w-full object-cover" />
                </span>
                <div>
                  <h2 className="font-extrabold text-xl text-savori-brown dark:text-savori-cream leading-tight">
                    Savori
                  </h2>
                  <p className="text-[10px] font-bold text-savori-orange uppercase tracking-wider">
                    Student Café
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {/* User Profile / Auth Status */}
              {user ? (
                <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 p-3 dark:from-slate-800/80 dark:to-slate-800/40 border border-orange-100 dark:border-slate-700">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-savori-orange text-white font-black text-lg shadow-sm">
                    {(user.name || user.email || "U")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                      {user.name || "Cafeteria User"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {user.email}
                    </p>
                    <span className="mt-1 inline-block rounded-full bg-savori-orange/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-savori-orange">
                      {user.role}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-3.5 text-center">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2.5">
                    Sign in to order and track meals in real-time
                  </p>
                  <Link
                    to="/login"
                    onClick={onClose}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-savori-orange py-2 text-xs font-bold text-white shadow-md shadow-savori-orange/20"
                  >
                    <LogIn size={14} /> Sign In
                  </Link>
                </div>
              )}

              {/* Clickable Meal Categories */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Meal Services
                  </span>
                  <Sparkles size={12} className="text-savori-orange" />
                </div>
                <div className="space-y-1.5">
                  {MEAL_CATEGORIES.map(({ key, label, hours, icon: Icon, badgeBg }) => {
                    const isActive = location.pathname === `/menu/${key}`;
                    return (
                      <Link
                        key={key}
                        to={`/menu/${key}`}
                        onClick={onClose}
                        className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                          isActive
                            ? "border-savori-orange bg-orange-50/80 dark:bg-orange-950/20 text-savori-orange font-bold shadow-sm"
                            : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-200 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                              isActive
                                ? "bg-savori-orange text-white"
                                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm"
                            }`}
                          >
                            <Icon size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold leading-tight">{label}</p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                              {hours}
                            </p>
                          </div>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeBg}`}>
                          View
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Main Navigation Links */}
              <div>
                <p className="mb-2 px-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Navigation
                </p>
                <div className="space-y-1">
                  <NavLink to="/" onClick={onClose} className={navItemClass}>
                    <div className="flex items-center gap-2.5">
                      <Home size={18} />
                      <span>{t("home")}</span>
                    </div>
                    <ChevronRight size={14} className="opacity-50" />
                  </NavLink>

                  <NavLink to="/orders" onClick={onClose} className={navItemClass}>
                    <div className="flex items-center gap-2.5">
                      <ClipboardList size={18} />
                      <span>{t("orders")}</span>
                    </div>
                    <ChevronRight size={14} className="opacity-50" />
                  </NavLink>

                  {/* Cart Link with Badge */}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setTimeout(() => {
                        document.dispatchEvent(new CustomEvent("toggle-cart-drawer"));
                      }, 150);
                    }}
                    className="flex w-full items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShoppingCart size={18} />
                      <span>View Cart</span>
                    </div>
                    {itemCount > 0 ? (
                      <span className="rounded-full bg-savori-orange px-2 py-0.5 text-xs font-black text-white">
                        {itemCount}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Empty</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Staff / Admin Controls */}
              {(user?.role === "staff" || user?.role === "admin") && (
                <div>
                  <p className="mb-2 px-1 text-[11px] font-extrabold uppercase tracking-wider text-savori-orange">
                    Staff & Management
                  </p>
                  <div className="space-y-1">
                    <NavLink to="/staff" onClick={onClose} className={navItemClass}>
                      <div className="flex items-center gap-2.5">
                        <ChefHat size={18} />
                        <span>Staff Dashboard</span>
                      </div>
                      <ChevronRight size={14} className="opacity-50" />
                    </NavLink>

                    <NavLink to="/staff/summary" onClick={onClose} className={navItemClass}>
                      <div className="flex items-center gap-2.5">
                        <ClipboardList size={18} />
                        <span>Prep Summary</span>
                      </div>
                      <ChevronRight size={14} className="opacity-50" />
                    </NavLink>

                    <NavLink to="/scan" onClick={onClose} className={navItemClass}>
                      <div className="flex items-center gap-2.5">
                        <QrCode size={18} />
                        <span>Scan QR Token</span>
                      </div>
                      <ChevronRight size={14} className="opacity-50" />
                    </NavLink>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        setTimeout(() => {
                          if (window.location.pathname !== "/staff") {
                            window.location.href = "/staff?action=add-meal";
                          } else {
                            window.dispatchEvent(new CustomEvent("open-add-meal-modal"));
                          }
                        }, 150);
                      }}
                      className="flex w-full items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-bold text-savori-orange bg-savori-orange/10 hover:bg-savori-orange hover:text-white transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <PlusCircle size={18} />
                        <span>+ Add Meal to Menu</span>
                      </div>
                      <ChevronRight size={14} className="opacity-50" />
                    </button>

                    {user?.role === "admin" && (
                      <NavLink to="/admin" onClick={onClose} className={navItemClass}>
                        <div className="flex items-center gap-2.5">
                          <BarChart2 size={18} />
                          <span>Admin Analytics</span>
                        </div>
                        <ChevronRight size={14} className="opacity-50" />
                      </NavLink>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Quick Controls & Logout */}
            <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-3 bg-slate-50/70 dark:bg-slate-900/80">
              {/* Theme & Language Row */}
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm"
                >
                  {theme === "dark" ? (
                    <>
                      <SunMedium size={14} className="text-amber-400" />
                      <span>Light</span>
                    </>
                  ) : (
                    <>
                      <Moon size={14} className="text-indigo-400" />
                      <span>Dark</span>
                    </>
                  )}
                </button>

                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm outline-none"
                >
                  <option value="en">English (EN)</option>
                  <option value="sw">Kiswahili (SW)</option>
                  <option value="fr">Français (FR)</option>
                  <option value="es">Español (ES)</option>
                  <option value="ar">العربية (AR)</option>
                </select>
              </div>

              {/* Logout / Login Button */}
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    logout();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/40 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                >
                  <LogOut size={14} /> {t("logout")}
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={onClose}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-savori-orange py-2.5 text-xs font-bold text-white shadow-md shadow-savori-orange/20"
                >
                  <LogIn size={14} /> {t("login")}
                </Link>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
