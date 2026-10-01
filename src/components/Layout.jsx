import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Bell,
  Menu,
  Moon,
  ShoppingCart,
  SunMedium,
  UtensilsCrossed,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import CartDrawer from "./CartDrawer.jsx";
import MobileSidebar from "./MobileSidebar.jsx";

const navClasses = ({ isActive }) =>
  `rounded-xl px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-savori-green/10 text-savori-green dark:bg-savori-green/20 dark:text-savori-green"
      : "text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
  }`;

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100">
      {/* Mobile Sliding Sidebar */}
      <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur dark:border-savori-brownLight dark:bg-savori-brown/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-3">
          {/* Left: Mobile Hamburger + Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-savori-orange/10 hover:text-savori-orange md:hidden transition-colors shadow-sm"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            <Link
              to={user?.role === "admin" ? "/admin" : user?.role === "staff" ? "/staff" : "/"}
              className="flex items-center gap-2 sm:gap-3 font-extrabold text-xl sm:text-2xl text-savori-brown dark:text-savori-cream group"
            >
              <span className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-savori-brown border border-savori-yellow/30 shadow-md shadow-savori-brown/25 overflow-hidden transition-transform duration-200 group-hover:scale-105">
                <img src="/logo.png" alt="Savori Logo" className="h-full w-full object-cover" />
              </span>
              <span className="tracking-tight">Savori</span>
            </Link>
          </div>

          {/* Desktop Navigation Links (hidden on mobile, served in MobileSidebar) */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            {!user?.role || user.role === "customer" ? (
              <>
                <NavLink to="/" className={navClasses}>
                  {t("home")}
                </NavLink>
                <NavLink to="/orders" className={navClasses}>
                  {t("orders")}
                </NavLink>
              </>
            ) : null}
            {user?.role === "staff" || user?.role === "admin" ? (
              <>
                <NavLink to="/staff" className={navClasses}>
                  {t("dashboard")}
                </NavLink>
                <NavLink to="/staff/summary" className={navClasses}>
                  Prep Summary
                </NavLink>
                <NavLink to="/scan" className={navClasses}>
                  Scan QR
                </NavLink>
                <button
                  type="button"
                  onClick={() => {
                    if (window.location.pathname !== "/staff") {
                      window.location.href = "/staff?action=add-meal";
                    } else {
                      window.dispatchEvent(new CustomEvent("open-add-meal-modal"));
                    }
                  }}
                  className="rounded-xl bg-savori-orange/15 px-3 py-1.5 text-xs font-black text-savori-orange hover:bg-savori-orange hover:text-white transition-all shadow-sm"
                  title="Add new meal to menu"
                >
                  + Add Meal
                </button>
              </>
            ) : null}
            {user?.role === "admin" ? (
              <NavLink to="/admin" className={navClasses}>
                Analytics
              </NavLink>
            ) : null}
          </nav>

          {/* Desktop Right Header Controls */}
          <div className="hidden md:flex items-center gap-2">
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm dark:border-savori-brownLight dark:bg-savori-brown text-savori-brown dark:text-savori-cream focus:ring-2 focus:ring-savori-orange outline-none"
              aria-label="Language"
            >
              <option value="en">EN</option>
              <option value="sw">SW</option>
              <option value="fr">FR</option>
              <option value="es">ES</option>
              <option value="ar">AR</option>
            </select>

            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-xl border border-slate-200 bg-white p-2 text-savori-brown dark:text-savori-cream dark:border-savori-brownLight dark:bg-savori-brown hover:bg-savori-orange/10 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <SunMedium size={18} /> : <Moon size={18} />}
            </button>

            {/* Cart button — customers only */}
            {!user?.role || user.role === "customer" ? (
              <button
                type="button"
                onClick={() =>
                  document.dispatchEvent(new CustomEvent("toggle-cart-drawer"))
                }
                className="relative rounded-xl border border-slate-200 bg-white p-2 text-savori-brown dark:text-savori-cream dark:border-savori-brownLight dark:bg-savori-brown hover:bg-savori-orange/10 transition-colors"
                aria-label="Cart"
              >
                <ShoppingCart size={18} />
                {itemCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-savori-orange px-1 text-[10px] font-bold text-white shadow-sm shadow-savori-orange/50">
                    {itemCount}
                  </span>
                ) : null}
              </button>
            ) : null}

            {user ? (
              <button
                type="button"
                onClick={logout}
                className="btn-secondary px-3 py-2 text-sm"
              >
                {t("logout")}
              </button>
            ) : (
              <Link to="/login" className="btn-primary px-3 py-2 text-sm">
                {t("login")}
              </Link>
            )}
          </div>

          {/* Mobile Right Quick Action Icons */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 dark:text-slate-200 dark:border-slate-800 dark:bg-slate-800 shadow-sm"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <SunMedium size={17} className="text-amber-400" /> : <Moon size={17} />}
            </button>

            {/* Cart Button */}
            {!user?.role || user.role === "customer" ? (
              <button
                type="button"
                onClick={() =>
                  document.dispatchEvent(new CustomEvent("toggle-cart-drawer"))
                }
                className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-700 dark:text-slate-200 dark:border-slate-800 dark:bg-slate-800 shadow-sm"
                aria-label="Cart"
              >
                <ShoppingCart size={17} />
                {itemCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-savori-orange px-1 text-[9px] font-black text-white shadow">
                    {itemCount}
                  </span>
                ) : null}
              </button>
            ) : null}

            {/* User Profile Avatar / Sign In */}
            {user ? (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-savori-orange/15 font-black text-xs text-savori-orange border border-savori-orange/30 shadow-sm"
                title={user.name || user.email}
              >
                {(user.name || user.email || "U")[0].toUpperCase()}
              </button>
            ) : (
              <Link
                to="/login"
                className="rounded-xl bg-savori-orange px-3 py-1.5 text-xs font-bold text-white shadow-sm"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
      {/* CartDrawer + mobile FAB — customers only */}
      {!user?.role || user.role === "customer" ? (
        <>
          <CartDrawer />
          <div className="fixed bottom-4 right-4 z-40 md:hidden">
            <button
              type="button"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-savori-orange text-white shadow-xl shadow-savori-orange/40 hover:bg-savori-green hover:shadow-savori-green/40 transition-all transform hover:scale-105"
              aria-label="Open cart"
              onClick={() =>
                document.dispatchEvent(new CustomEvent("toggle-cart-drawer"))
              }
            >
              <ShoppingCart size={24} />
              {itemCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-savori-green px-1 text-xs font-bold text-white shadow-md">
                  {itemCount}
                </span>
              ) : null}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
