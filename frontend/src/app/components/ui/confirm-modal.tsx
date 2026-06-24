import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  loadingText?: string;
  variant?: "danger" | "default";
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
  loadingText = "Loading...",
  variant = "danger",
}: ConfirmModalProps) {
  const buttonColor = variant === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-black hover:bg-gray-900";
  const iconColor = variant === "danger" ? "text-red-600" : "text-black";
  const iconBg = variant === "danger" ? "bg-red-50" : "bg-gray-50";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center`}>
                <AlertTriangle size={20} className={iconColor} />
              </div>
              <button onClick={onCancel} disabled={isLoading} className="text-gray-400 hover:text-black transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <h3 className="text-base font-bold text-black mb-2">{title}</h3>
            <p className="text-sm text-gray-500 mb-6">{description}</p>
            
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 py-2 ${buttonColor} text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2`}
              >
                {isLoading ? loadingText : confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
