"use client";

import { AdminLayout } from "./admin-sidebar";

export function AdminSettings() {
  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-black">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure platform preferences</p>
      </div>

      <div className="max-w-xl space-y-4">
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-500">
            All quiz-specific settings are now available on each quiz's settings page.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
