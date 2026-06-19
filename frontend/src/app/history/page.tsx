"use client";

import { UserGuard } from "../components/guards";
import { HistoryPage } from "../components/history-page";

export default function Page() {
  return (
    <UserGuard>
      <HistoryPage />
    </UserGuard>
  );
}
