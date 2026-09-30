import { Link, NavLink } from "react-router-dom";
import {
  Bell,
  Moon,
  ShoppingCart,
  SunMedium,
  UtensilsCrossed,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import CartDrawer from "./CartDrawer.jsx";

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
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur dark:border-savori-brownLight dark:bg-savori-brown/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-3 font-extrabold text-2xl text-savori-brown dark:text-savori-cream"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-savori-green text-white shadow-md shadow-savori-green/30">
              <UtensilsCrossed size={24} />
            </span>
            Savori
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <NavLink to="/" className={navClasses}>
              {t("home")}
            </NavLink>
            <NavLink to="/orders" className={navClasses}>
              {t("orders")}
            </NavLink>
            {user?.role === "staff" || user?.role === "admin" ? (
              <NavLink to="/staff" className={navClasses}>
                {t("dashboard")}
              </NavLink>
            ) : null}
            {user?.role === "admin" ? (
              <NavLink to="/admin" className={navClasses}>
                Analytics
              </NavLink>
            ) : null}
          </nav>

          <div className="flex items-center gap-2">
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
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
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
    </div>
  );
}
