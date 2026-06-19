"use client";

import { UserGuard } from "../../../components/guards";
import { InstructionsPage } from "../../../components/instructions-page";

export default function Page() {
  return (
    <UserGuard>
      <InstructionsPage />
    </UserGuard>
  );
}
