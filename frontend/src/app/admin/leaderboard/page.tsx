"use client";

import { AdminGuard } from "../../components/guards";
import { AdminLayout } from "../../components/admin-sidebar";
import { AdminLeaderboard } from "./components/AdminLeaderboard";

export default function Page() {
  return (
    <AdminGuard>
      <AdminLayout>
        <div className="max-w-7xl mx-auto p-6 bg-white min-h-screen">
          <AdminLeaderboard />
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
