"use client";

import { AdminGuard } from "../../components/guards";
import { AdminQuestions } from "../../components/admin-questions";

export default function Page() {
  return (
    <AdminGuard>
      <AdminQuestions />
    </AdminGuard>
  );
}
