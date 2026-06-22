"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt?: string;
}

export function ImageModal({ isOpen, onClose, imageUrl, alt = "Question image" }: ImageModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative max-w-4xl max-h-[90vh] w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 text-white hover:text-gray-200 transition-colors"
          >
            <X size={32} />
          </button>

          {/* Image container */}
          <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
            <img
              src={imageUrl}
              alt={alt}
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
