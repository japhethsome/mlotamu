import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return (
      <Navigate
        to={user.role === "admin" ? "/admin" : user.role === "staff" ? "/staff" : "/"}
        replace
      />
    );
  }

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
    <div className="mx-auto flex min-h-[85vh] max-w-md items-center justify-center px-4 py-8">
      <div className="card-surface w-full p-8 sm:p-10 shadow-2xl border border-slate-200/80 dark:border-savori-brownLight/50">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-3xl bg-savori-brown border-2 border-savori-yellow/40 shadow-xl shadow-savori-brown/30 overflow-hidden transform hover:scale-105 transition-transform">
            <img src="/logo.png" alt="Savori Logo" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-savori-brown dark:text-savori-cream">
            Welcome to Savori
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Sign in to continue to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-savori-orange focus:ring-2 focus:ring-savori-orange/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-none transition"
              required
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-11 text-slate-900 shadow-sm focus:border-savori-orange focus:ring-2 focus:ring-savori-orange/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-none transition"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <div className="text-right -mt-2">
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-savori-orange hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-600 dark:bg-rose-950/40 dark:border-rose-900">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary w-full py-3.5 font-bold text-base shadow-lg shadow-savori-orange/30 hover:scale-[1.01] transition-transform mt-2"
            disabled={loading}
          >
            {loading ? "Authenticating…" : "Sign In"}
          </button>

          {/* Footer */}
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
