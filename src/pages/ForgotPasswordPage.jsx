import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { apiRequest } from "../lib/api.js";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      if (res.resetToken) setResetToken(res.resetToken);
      else setError("No account found for that email.");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) { setError("Passwords do not match."); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    setResetting(true);
    setError("");
    try {
      await apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      });
      setDone(true);
    } catch (err) {
      setError(err.message || "Reset failed. The link may have expired.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-savori-cream via-white to-orange-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">

          {/* Header */}
          <div className="bg-savori-brown px-8 py-7 text-white text-center relative">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur mb-3">
              <KeyRound size={28} />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Forgot Password?</h1>
            <p className="text-sm text-white/70 mt-1">We will get you back in</p>
          </div>

          <div className="p-8 space-y-5">

            {/* SUCCESS */}
            {done ? (
              <div className="text-center space-y-4 py-4">
                <div className="flex justify-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 size={36} />
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Password Reset!</h2>
                <p className="text-sm text-slate-500">Your password has been updated successfully.</p>
                <Link
                  to="/login"
                  className="btn-primary w-full flex justify-center items-center gap-2 mt-4"
                >
                  Back to Login
                </Link>
              </div>

            ) : !resetToken ? (
              /* STEP 1 — enter email */
              <form onSubmit={handleForgot} className="space-y-4">
                <p className="text-sm text-slate-500">Enter your registered email address and we will generate a reset code for you.</p>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-savori-orange/30"
                    />
                  </div>
                </div>
                {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
                <button type="submit" disabled={loading}
                  className="btn-primary w-full flex justify-center items-center gap-2">
                  {loading ? "Sending..." : "Send Reset Code"}
                </button>
                <div className="text-center">
                  <Link to="/login" className="flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-savori-brown transition-colors">
                    <ArrowLeft size={13} /> Back to Login
                  </Link>
                </div>
              </form>

            ) : (
              /* STEP 2 — set new password */
              <form onSubmit={handleReset} className="space-y-4">
                <p className="text-sm text-slate-500">
                  Reset code generated. Enter your new password below.
                </p>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-savori-orange/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-savori-orange/30"
                  />
                </div>
                {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
                <button type="submit" disabled={resetting}
                  className="btn-primary w-full flex justify-center items-center gap-2">
                  {resetting ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
