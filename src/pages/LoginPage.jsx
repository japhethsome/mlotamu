import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, ChefHat, User, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const DEMO_ACCOUNTS = [
  {
    role: "Customer",
    email: "customer@example.com",
    password: "Password123!",
    icon: User,
    color: "from-amber-500 to-savori-orange",
    desc: "Browse menu & order",
  },
  {
    role: "Kitchen Staff",
    email: "staff@example.com",
    password: "Password123!",
    icon: ChefHat,
    color: "from-emerald-500 to-savori-greenDark",
    desc: "Manage orders & meals",
  },
  {
    role: "Administrator",
    email: "admin@example.com",
    password: "Password123!",
    icon: ShieldCheck,
    color: "from-savori-brown to-savori-brownLight",
    desc: "Full cafeteria analytics",
  },
];

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState("Kitchen Staff");
  const [form, setForm] = useState({
    email: "staff@example.com",
    password: "Password123!",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSelectRole = (acc) => {
    setSelectedRole(acc.role);
    setForm({ email: acc.email, password: acc.password });
    setError("");
  };

  const handleQuickLogin = async (acc) => {
    setSelectedRole(acc.role);
    setForm({ email: acc.email, password: acc.password });
    setLoading(true);
    setError("");
    try {
      await login(acc.email, acc.password);
      if (acc.role === "Kitchen Staff") {
        navigate("/staff");
      } else if (acc.role === "Administrator") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const loggedUser = await login(form.email, form.password);
      if (loggedUser?.role === "staff") {
        navigate("/staff");
      } else if (loggedUser?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[85vh] max-w-xl items-center justify-center px-4 py-8">
      <div className="card-surface w-full p-6 sm:p-10 shadow-2xl border border-slate-200/80 dark:border-savori-brownLight/50">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-3xl bg-savori-brown border-2 border-savori-yellow/40 shadow-xl shadow-savori-brown/30 overflow-hidden transform hover:scale-105 transition-transform">
            <img src="/logo.png" alt="Savori Logo" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-savori-brown dark:text-savori-cream">
            Welcome to Savori
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Select an official role below or enter your credentials. No empty spaces required!
          </p>
        </div>

        {/* Quick Role Selection Cards */}
        <div className="mb-6">
          <label className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Quick Select Account</span>
            <span className="flex items-center gap-1 text-savori-orange">
              <Sparkles size={13} /> Auto-filled
            </span>
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {DEMO_ACCOUNTS.map((acc) => {
              const Icon = acc.icon;
              const isSelected = selectedRole === acc.role;
              return (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleSelectRole(acc)}
                  className={`flex flex-col items-center justify-center rounded-2xl p-3 text-center transition-all duration-200 border ${
                    isSelected
                      ? "border-savori-orange bg-gradient-to-b from-orange-50 to-amber-50 dark:from-savori-brown dark:to-savori-brownLight/60 shadow-md ring-2 ring-savori-orange/30"
                      : "border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-900/60 hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${acc.color} text-white shadow-sm mb-1.5`}
                  >
                    <Icon size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {acc.role}
                  </span>
                  <span className="text-[10px] text-slate-500 line-clamp-1">
                    {acc.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-savori-orange focus:ring-2 focus:ring-savori-orange/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-11 text-slate-900 shadow-sm focus:border-savori-orange focus:ring-2 focus:ring-savori-orange/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-600 dark:bg-rose-950/40 dark:border-rose-900">
              {error}
            </div>
          ) : null}

          <div className="space-y-2 pt-2">
            <button
              type="submit"
              className="btn-primary w-full py-3.5 font-bold text-base shadow-lg shadow-savori-orange/30 hover:scale-[1.01] transition-transform"
              disabled={loading}
            >
              {loading ? "Authenticating..." : `Sign In as ${selectedRole}`}
            </button>

            <button
              type="button"
              onClick={() => {
                const currentAcc = DEMO_ACCOUNTS.find((a) => a.role === selectedRole) || DEMO_ACCOUNTS[0];
                handleQuickLogin(currentAcc);
              }}
              className="w-full rounded-2xl border border-savori-orange/40 bg-savori-orange/10 py-2.5 text-sm font-semibold text-savori-orange hover:bg-savori-orange/20 transition-colors"
            >
              🚀 1-Click Instant Login
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Don't have an account?</span>
            <Link
              to="/register"
              className="text-savori-orange hover:underline font-bold"
            >
              Create Customer Account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
