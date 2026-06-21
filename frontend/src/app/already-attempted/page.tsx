"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { AlertCircle, Home, History, BookOpen } from "lucide-react";
import { Suspense } from "react";

function AlreadyAttemptedContent() {
  const router = useRouter();
  const params = useSearchParams();
  const quizId = params.get("quizId");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 max-w-md w-full p-8 text-center"
      >
        {/* Icon */}
        <div className="w-16 h-16 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <AlertCircle size={32} className="text-amber-500" />
        </div>

        {/* Text */}
        <h1 className="text-xl font-bold text-black mb-2">Quiz Already Attempted</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          You have already submitted this quiz. Each quiz can only be attempted once.
          Head to your history to view your result.
        </p>

        {/* Divider */}
        <div className="border-t border-gray-100 mb-6" />

        {/* Actions */}
        <div className="space-y-2.5">
          <button
            onClick={() => router.push("/history")}
            className="w-full flex items-center justify-center gap-2 bg-black text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-900 transition-colors"
          >
            <History size={16} />
            View My Result
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 rounded-xl py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Home size={16} />
            Return to Dashboard
          </button>
        </div>

        {/* Brand */}
        <div className="flex items-center justify-center gap-1.5 mt-6 text-xs text-gray-300">
          <BookOpen size={12} />
          <span>Quizzify</span>
        </div>
      </motion.div>
    </div>
  );
}

export default function AlreadyAttemptedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <AlreadyAttemptedContent />
    </Suspense>
  );
}
