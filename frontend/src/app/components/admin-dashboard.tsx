import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { AdminLayout } from "./admin-sidebar";
import {
  apiAdminGetQuizzes,
  apiAdminGetStudents,
  apiAdminGetResults,
  Quiz,
  StoredUser,
  QuizResult,
} from "./api";
import { Users, BookOpen, BarChart2, Trophy, CheckCircle2, Clock, Loader2 } from "lucide-react";

export function AdminDashboard() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [students, setStudents] = useState<StoredUser[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [q, s, r] = await Promise.all([
          apiAdminGetQuizzes(),
          apiAdminGetStudents(),
          apiAdminGetResults(),
        ]);
        setQuizzes(q);
        setStudents(s);
        setResults(r);
      } catch (err) {
        console.error("Failed to load dashboard statistics", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const totalUsers = students.length;
  const totalQuizzes = quizzes.length;
  const totalAttempts = results.length;
  const averageScore =
    totalAttempts > 0
      ? Math.round(results.reduce((sum, r) => sum + Number(r.percentage), 0) / totalAttempts)
      : 0;

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-black mb-2" size={24} />
          <p className="text-sm text-gray-500">Loading admin metrics…</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-black">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform overview and key metrics</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Students", value: totalUsers.toLocaleString(), icon: Users, delta: "Active registrants" },
          { label: "Total Quizzes", value: totalQuizzes, icon: BookOpen, delta: `${quizzes.filter(q => q.isPublished).length} published` },
          { label: "Total Attempts", value: totalAttempts.toLocaleString(), icon: BarChart2, delta: "Submissions logged" },
          { label: "Average Score", value: `${averageScore}%`, icon: Trophy, delta: "Overall candidate average" },
        ].map(({ label, value, icon: Icon, delta }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white border border-gray-100 rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500">{label}</p>
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                <Icon size={14} className="text-gray-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-black">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{delta}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-black mb-4">Quiz Overview</h3>
          <div className="space-y-3">
            {quizzes.slice(0, 4).map((quiz) => (
              <div key={quiz.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black truncate">{quiz.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={11} /> {quiz.durationInMinutes}m
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <CheckCircle2 size={11} /> {quiz.totalMarks} marks
                    </span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ml-3 ${
                  quiz.isPublished ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  {quiz.isPublished ? "PUBLISHED" : "DRAFT"}
                </span>
              </div>
            ))}
            {quizzes.length === 0 && (
              <div className="text-center text-xs text-gray-400 py-6">No quizzes created yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent results */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h3 className="text-sm font-semibold text-black">Recent Results</h3>
        </div>
        {results.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                {["User", "Quiz", "Score", "Percentage", "Date"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.slice(0, 5).map((r) => (
                <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-sm font-medium text-black">{r.student?.fullName || "Student"}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{r.quiz?.title || "Quiz"}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">
                    {r.score}/{r.quiz?.totalMarks || r.totalQuestions * 3}
                  </td>
                  <td className="px-5 py-3 text-sm font-semibold text-black">{r.percentage}%</td>
                  <td className="px-5 py-3 text-sm text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center text-xs text-gray-400 py-12">No attempts submitted yet.</div>
        )}
      </div>
    </AdminLayout>
  );
}
