import { AdminLayout } from "./admin-sidebar";
import { motion } from "motion/react";

export function AdminAnalytics() {
  // No real analytics endpoints currently. Show empty state.
  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-black">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform performance and trends</p>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center h-64 bg-white border border-gray-100 rounded-xl"
      >
        <p className="text-gray-500">No analytics data available.</p>
      </motion.div>
    </AdminLayout>
  );
}
