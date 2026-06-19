"use client";

import { AdminGuard } from "../../components/guards";
import { AdminUsers } from "../../components/admin-users";

export default function Page() {
  return (
    <AdminGuard>
      <AdminUsers />
    </AdminGuard>
  );
}
