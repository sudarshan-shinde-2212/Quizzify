import { useState } from "react";
import { motion } from "motion/react";
import { useAuth } from "./auth-context";
import { useNavigate } from "react-router";
import { BookOpen, Shield, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";

export function AdminLoginPage() {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await adminLogin(email, password);
      navigate("/admin");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Invalid credentials. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Back link */}
        <button
          id="back-to-login"
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition-colors mb-8"
        >
          <ArrowLeft size={14} /> Back to login
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <BookOpen size={20} className="text-black" />
          <span className="font-semibold text-lg tracking-tight">Quizzify</span>
          <span className="ml-1 text-xs bg-black text-white px-2 py-0.5 rounded-full">Admin</span>
        </div>

        {/* Heading */}
        <div className="flex items-center gap-2 mb-1">
          <Shield size={18} className="text-black" />
          <h1 className="text-2xl font-bold text-black">Admin Login</h1>
        </div>
        <p className="text-gray-500 text-sm mb-8">Restricted access — administrators only</p>

        {/* Form */}
        <form id="admin-login-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="admin-email" className="block text-xs font-medium text-gray-700 mb-1.5">
              Email address
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              autoComplete="email"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="admin-password" className="block text-xs font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black transition-colors pr-10"
              />
              <button
                type="button"
                id="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 flex items-start gap-2"
              role="alert"
            >
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
            </motion.div>
          )}

          {/* Submit */}
          <button
            id="admin-login-submit"
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
