"use client";

import { AdminGuard } from "../../components/guards";
import { AdminQuizzes } from "../../components/admin-quizzes";

export default function Page() {
  return (
    <AdminGuard>
      <AdminQuizzes />
    </AdminGuard>
  );
}
