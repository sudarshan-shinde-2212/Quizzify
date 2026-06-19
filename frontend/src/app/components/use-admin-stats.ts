import { useEffect, useState } from "react";
import {
  apiAdminGetStudents,
  apiAdminGetQuizzes,
  apiAdminGetResults,
  StoredUser,
  Quiz,
  QuizResult,
} from "./api";

/**
 * Hook that fetches students, quizzes and results for admin dashboards.
 * Returns loading state, any error and the raw data arrays.
 */
export function useAdminStats() {
  const [students, setStudents] = useState<StoredUser[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [s, q, r] = await Promise.all([
          apiAdminGetStudents(),
          apiAdminGetQuizzes(),
          apiAdminGetResults(),
        ]);
        setStudents(s);
        setQuizzes(q);
        setResults(r);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
        console.error("Failed to load admin stats", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { students, quizzes, results, loading, error };
}
