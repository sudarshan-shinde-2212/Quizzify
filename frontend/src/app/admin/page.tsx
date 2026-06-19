"use client";

import { AdminGuard } from "../components/guards";
import { AdminDashboard } from "../components/admin-dashboard";

export default function Page() {
  return (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  );
}
