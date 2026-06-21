"use client";

import { AdminGuard } from "../../components/guards";
import { AdminAiQuizGenerator } from "../../components/admin-ai-quiz-generator";

export default function Page() {
  return (
    <AdminGuard>
      <AdminAiQuizGenerator />
    </AdminGuard>
  );
}
