"use client";

import { UserGuard } from "../../components/guards";
import { QuizPage } from "../../components/quiz-page";

export default function Page() {
  return (
    <UserGuard>
      <QuizPage />
    </UserGuard>
  );
}
