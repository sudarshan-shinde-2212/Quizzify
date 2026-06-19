"use client";

import { UserGuard } from "../components/guards";
import { ProfilePage } from "../components/profile-page";

export default function Page() {
  return (
    <UserGuard>
      <ProfilePage />
    </UserGuard>
  );
}
