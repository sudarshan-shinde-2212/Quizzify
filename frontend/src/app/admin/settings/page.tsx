"use client";

import { AdminGuard } from "../../components/guards";
import { AdminSettings } from "../../components/admin-settings";

export default function Page() {
  return (
    <AdminGuard>
      <AdminSettings />
    </AdminGuard>
  );
}
