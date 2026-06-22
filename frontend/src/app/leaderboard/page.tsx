"use client";

import { UserGuard } from "../components/guards";
import { UserLayout } from "../components/user-layout";
import { Leaderboard } from "../components/leaderboard";

export default function Page() {
  return (
    <UserGuard>
      <UserLayout>
        <div className="max-w-4xl mx-auto">
          <Leaderboard />
        </div>
      </UserLayout>
    </UserGuard>
  );
}
