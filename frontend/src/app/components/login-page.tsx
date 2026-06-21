"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useAuth } from "./auth-context";
import { useRouter } from "next/navigation";
import { BookOpen, ArrowRight, Shield, Loader2 } from "lucide-react";

export function LoginPage() {
  const { loginWithGoogle } = useAuth();
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    // Redirects browser to backend OAuth – no return from this call
    loginWithGoogle();
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
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
              onClick={() => router.push("/admin/login")}
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
      </div>
    </div>
  );
}
