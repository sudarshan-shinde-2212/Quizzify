"use client";

import { AdminGuard } from "../../components/guards";
import { AdminLayout } from "../../components/admin-sidebar";
import { Leaderboard } from "../../components/leaderboard";

export default function Page() {
  return (
    <AdminGuard>
      <AdminLayout>
        <div className="max-w-4xl mx-auto">
          <Leaderboard />
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
