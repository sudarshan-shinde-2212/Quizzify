"use client";

import { useEffect, useState } from "react";
import { UserLayout } from "./user-layout";
import { apiGetStudentResults, QuizResult } from "./api";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, Trophy, Calendar, Loader2, Search } from "lucide-react";

interface QuizResultWithAttemptNumber extends QuizResult {
  attemptNumber: number;
}

export function HistoryPage() {
  const [history, setHistory] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Process history to add attempt numbers
  const processedHistory = history.slice().sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Assign attempt numbers per quiz
  const attemptCounter = new Map<string, number>();
  const historyWithAttemptNumbers: QuizResultWithAttemptNumber[] = processedHistory.map(item => {
    const currentCount = attemptCounter.get(item.quizId) || 0;
    const attemptNumber = currentCount + 1;
    attemptCounter.set(item.quizId, attemptNumber);
    return { ...item, attemptNumber };
  });

  const filteredHistory = historyWithAttemptNumbers.filter((item) =>
    (item.quiz?.title ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await apiGetStudentResults();
        setHistory(data);
      } catch (err) {
        console.error("Failed to load attempt history", err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  if (loading) {
    return (
      <UserLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-black mb-2" size={24} />
          <p className="text-sm text-gray-500">Loading attempt history…</p>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="flex items-center mb-6">
        <div className="relative w-full md:w-[600px]">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search quizzes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 text-black placeholder-gray-500 bg-white border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-all"
          />
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-gray-100 rounded-xl overflow-hidden">
        {filteredHistory.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                {["Quiz Name", "Attempt", "Score", "Percentage", "Correct", "Wrong", "Date", "Result"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item, i) => {
                const isCheating = item.cheatingDetected || item.attempt?.isCheating;
                const passingScore = item.quiz?.passingScore ?? 60;
                const passed = !isCheating && item.percentage !== null && item.percentage >= passingScore;
                const isFirstAttempt = item.attemptNumber === 1;
                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-black">{item.quiz?.title || "Unknown Quiz"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-black">#{item.attemptNumber}</span>
                        {isFirstAttempt && !isCheating && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                            Official
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {isCheating || item.score === null ? (
                        <span className="text-sm font-semibold text-gray-400">—</span>
                      ) : (
                        <span className="text-sm font-semibold text-black">
                          {item.score}/{item.quiz?.totalMarks || item.totalQuestions * 3}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {isCheating || item.percentage === null ? (
                        <span className="text-sm font-semibold text-gray-400">—</span>
                      ) : (
                        <span className="text-sm text-gray-700 font-semibold">{item.percentage}%</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {isCheating ? (
                        <span className="text-sm font-semibold text-gray-400">—</span>
                      ) : (
                        <span className="text-sm text-green-600 font-medium">{item.correctAnswers}</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {isCheating ? (
                        <span className="text-sm font-semibold text-gray-400">—</span>
                      ) : (
                        <span className="text-sm text-red-500 font-medium">{item.wrongAnswers}</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Calendar size={13} />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {isCheating ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                          <XCircle size={11} /> Disqualified
                        </span>
                      ) : passed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                          <CheckCircle2 size={11} /> Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                          <XCircle size={11} /> Failed
                        </span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="py-16 text-center">
            <Trophy size={32} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm text-gray-400">No quiz attempts yet.</p>
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filteredHistory.map((item, i) => {
          const isCheating = item.cheatingDetected || item.attempt?.isCheating;
          const passingScore = item.quiz?.passingScore ?? 60;
          const passed = !isCheating && item.percentage !== null && item.percentage >= passingScore;
          const isFirstAttempt = item.attemptNumber === 1;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-gray-100 rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-black leading-tight">
                    {item.quiz?.title || "Unknown Quiz"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold text-gray-700">Attempt #{item.attemptNumber}</span>
                    {isFirstAttempt && !isCheating && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                        Official
                      </span>
                    )}
                  </div>
                </div>
                {isCheating ? (
                  <span className="text-xs text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full shrink-0">Cheating Detected</span>
                ) : passed ? (
                  <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full shrink-0">Passed</span>
                ) : (
                  <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full shrink-0">Failed</span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-1">
                {!isCheating && item.score !== null && (
                  <span>Score: <span className="font-medium text-black">{item.score}/{item.quiz?.totalMarks}</span></span>
                )}
                {!isCheating && item.percentage !== null && (
                  <span>Percentage: <span className="font-medium text-black">{item.percentage}%</span></span>
                )}
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              {!isCheating && (
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Correct: <span className="font-medium text-green-600">{item.correctAnswers}</span></span>
                  <span>Wrong: <span className="font-medium text-red-500">{item.wrongAnswers}</span></span>
                </div>
              )}
              {isCheating && (
                <div className="text-xs font-semibold text-red-700 mt-1">
                  Result: Disqualified
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </UserLayout>
  );
}
