import { useEffect, useState } from "react";
import { AdminLayout } from "./admin-sidebar";
import { apiAdminGetResults, QuizResult } from "./api";
import { motion } from "motion/react";
import { Download, Loader2 } from "lucide-react";

export function AdminResults() {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResults() {
      try {
        const data = await apiAdminGetResults();
        setResults(data);
      } catch (err) {
        console.error("Failed to fetch attempt logs", err);
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, []);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-black">Submissions History</h1>
          <p className="text-sm text-gray-500 mt-0.5">{results.length} total attempts logged</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 cursor-pointer"
          >
            <Download size={14} /> Print / Export
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-black mb-2" size={24} />
          <p className="text-sm text-gray-500">Loading submissions list…</p>
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl py-16 text-center text-gray-400">
          No attempts or submissions recorded yet.
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                {["Candidate Name", "Email Address", "Quiz Title", "Score", "Percentage", "Submitted At"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-5 py-3.5 text-sm font-medium text-black">
                    {r.student?.fullName || "Student"}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">
                    {r.student?.email || "Unknown Email"}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    {r.quiz?.title || "Unknown Quiz"}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-700 font-semibold">
                    {r.score}/{r.quiz?.totalMarks || r.totalQuestions * 3}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-black h-1.5 rounded-full"
                          style={{ width: `${r.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 font-medium">{r.percentage}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-400">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
