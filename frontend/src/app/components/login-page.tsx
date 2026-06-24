"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "./auth-context";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
} from "lucide-react";

export function LoginPage() {
  const { loginWithGoogle, adminLogin } = useAuth();
  const router = useRouter();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    // Redirects browser to backend OAuth – no return from this call
    loginWithGoogle();
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setError("");
    try {
      await adminLogin(email, password);
      router.push("/admin");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Invalid credentials. Please try again.";
      setError(message);
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-black flex-col justify-center p-12">
        <div className="flex items-center gap-2">
          <BookOpen size={24} className="text-white" />
          <span className="text-white font-semibold text-xl tracking-tight">Quizzify</span>
        </div>

        <div className="max-w-xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-white text-4xl font-bold leading-tight mb-6"
          >
            Test your skills.<br />Track your growth.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/60 text-base leading-relaxed max-w-sm"
          >
            A professional assessment platform for technical teams. Take quizzes,
            view real-time results, and benchmark your performance.
          </motion.p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center px-6">
        <AnimatePresence mode="wait">
          {!showAdminLogin ? (
            <motion.div
              key="user-login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm"
            >
              {/* Mobile logo */}
              <div className="flex items-center gap-2 mb-10 lg:hidden">
                <BookOpen size={20} className="text-black" />
                <span className="font-semibold text-lg tracking-tight">Quizzify</span>
              </div>

              <h2 className="text-2xl font-bold text-black mb-1">Welcome</h2>
              <p className="text-gray-500 text-sm mb-8">Sign in to your account to continue</p>

              {/* Google sign-in button */}
              <button
                id="google-login-btn"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <Loader2 size={18} className="animate-spin text-gray-500" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.548 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                )}
                {googleLoading ? "Redirecting…" : "Continue with Google"}
              </button>

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">OR</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <div className="text-center">
                <button
                  id="admin-login-link"
                  onClick={() => setShowAdminLogin(true)}
                  className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors"
                >
                  <Shield size={14} />
                  Admin login
                  <ArrowRight size={14} />
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center mt-8">
                By signing in, you agree to our Terms of Service and Privacy Policy.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="admin-login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm"
            >
              {/* Mobile logo */}
              <div className="flex items-center gap-2 mb-10 lg:hidden">
                <BookOpen size={20} className="text-black" />
                <span className="font-semibold text-lg tracking-tight">Quizzify</span>
              </div>

              {/* Back button */}
              <button
                id="back-to-login"
                onClick={() => {
                  setShowAdminLogin(false);
                  setEmail("");
                  setPassword("");
                  setError("");
                }}
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition-colors mb-8"
              >
                <ArrowLeft size={14} /> Back to User Login
              </button>

              {/* Heading */}
              <div className="flex items-center gap-2 mb-1">
                <Shield size={18} className="text-black" />
                <h1 className="text-2xl font-bold text-black">Admin Login</h1>
              </div>
              <p className="text-gray-500 text-sm mb-8">Sign in with administrator credentials</p>

              {/* Form */}
              <form id="admin-login-form" onSubmit={handleAdminSubmit} className="space-y-4">
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
                  disabled={adminLoading}
                  className="w-full flex items-center justify-center gap-2 bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {adminLoading && <Loader2 size={15} className="animate-spin" />}
                  {adminLoading ? "Signing in…" : "Login"}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
