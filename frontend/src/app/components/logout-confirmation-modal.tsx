"use client";

import { useEffect, useCallback } from "react";
import { LogOut, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LogoutConfirmationModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function LogoutConfirmationModal({
  isOpen,
  onCancel,
  onConfirm,
  isLoading = false,
}: LogoutConfirmationModalProps) {
  // ESC key closes modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) onCancel();
    },
    [isOpen, isLoading, onCancel]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop – click outside to cancel */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            onClick={isLoading ? undefined : onCancel}
            aria-hidden="true"
          />

          {/* Modal panel */}
          <motion.div
            key="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
            aria-describedby="logout-modal-desc"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-[101] flex items-center justify-center px-4 pointer-events-none"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto overflow-hidden">
              {/* Header */}
              <div className="flex items-start justify-between p-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                    <LogOut size={18} className="text-red-600" />
                  </div>
                  <div>
                    <h2
                      id="logout-modal-title"
                      className="text-base font-bold text-gray-900 leading-tight"
                    >
                      Confirm Logout
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">Quizzify session</p>
                  </div>
                </div>
                {!isLoading && (
                  <button
                    onClick={onCancel}
                    aria-label="Close"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-100 mx-6" />

              {/* Body */}
              <div className="px-6 py-5">
                <p
                  id="logout-modal-desc"
                  className="text-sm text-gray-600 leading-relaxed"
                >
                  Are you sure you want to log out of{" "}
                  <span className="font-semibold text-gray-900">Quizzify</span>?
                  <br />
                  <span className="text-gray-400 text-xs mt-1 inline-block">
                    Your session will be ended and you will need to sign in again.
                  </span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 px-6 pb-6">
                <button
                  onClick={onCancel}
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      Logging out…
                    </>
                  ) : (
                    <>
                      <LogOut size={14} />
                      Logout
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
