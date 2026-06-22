"use client";

import { useEffect, useState } from "react";
import { UserLayout } from "./user-layout";
import { apiGetStudentResults, QuizResult } from "./api";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, Trophy, Calendar, Loader2 } from "lucide-react";

export function HistoryPage() {
  const [history, setHistory] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const filteredHistory = history.filter((item) =>
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
      <div className="flex items-center mb-4">
  <input
    type="text"
    placeholder="Search quizzes..."
    value={searchTerm}
    onChange={e => setSearchTerm(e.target.value)}
    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
  />
</div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-gray-100 rounded-xl overflow-hidden">
        {history.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                {["Quiz Name", "Score", "Percentage", "Correct", "Wrong", "Date", "Status"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((item, i) => {
                const passed = item.percentage >= 60;
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
                      <span className="text-sm font-semibold text-black">
                        {item.score}/{item.quiz?.totalMarks || item.totalQuestions * 3}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-700 font-semibold">{item.percentage}%</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-green-600 font-medium">{item.correctAnswers}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-red-500 font-medium">{item.wrongAnswers}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Calendar size={13} />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {item.cheatingDetected ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                          <XCircle size={11} /> Cheating Detected
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
        {history.map((item, i) => {
          const passed = item.percentage >= 60;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-gray-100 rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-semibold text-black leading-tight flex-1 pr-2">
                  {item.quiz?.title || "Unknown Quiz"}
                </p>
                {item.cheatingDetected ? (
                  <span className="text-xs text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full shrink-0">Cheating Detected</span>
                ) : passed ? (
                  <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full shrink-0">Passed</span>
                ) : (
                  <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full shrink-0">Failed</span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-1">
                <span>Score: <span className="font-medium text-black">{item.score}/{item.quiz?.totalMarks}</span></span>
                <span>Percentage: <span className="font-medium text-black">{item.percentage}%</span></span>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Correct: <span className="font-medium text-green-600">{item.correctAnswers}</span></span>
                <span>Wrong: <span className="font-medium text-red-500">{item.wrongAnswers}</span></span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </UserLayout>
  );
}
