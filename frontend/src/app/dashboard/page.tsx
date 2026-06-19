"use client";

import { UserGuard } from "../components/guards";
import { Dashboard } from "../components/dashboard";

export default function Page() {
  return (
    <UserGuard>
      <Dashboard />
    </UserGuard>
  );
}
