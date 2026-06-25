import { useEffect, useState, useMemo } from "react";
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
import { Users, BookOpen, BarChart2, Trophy, CheckCircle2, Clock, Loader2, Search } from "lucide-react";
import { useDebounce } from "./use-debounce";
import { StudentHistoryDrawer } from "./StudentHistoryDrawer";

export function AdminDashboard() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [students, setStudents] = useState<StoredUser[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

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
  
  // Calculate average score only from non-cheating attempts
  const validResults = results.filter(r => r.percentage !== null && !r.cheatingDetected);
  const averageScore =
    validResults.length > 0
      ? Math.round(validResults.reduce((sum, r) => sum + Number(r.percentage), 0) / validResults.length)
      : 0;

  const filteredQuizzes = useMemo(() => {
    if (!debouncedSearch) return quizzes;
    const lower = debouncedSearch.toLowerCase();
    return quizzes.filter(q => 
      q.title.toLowerCase().includes(lower) || 
      q.description.toLowerCase().includes(lower) ||
      (q.visibility && q.visibility.toLowerCase().includes(lower)) ||
      (q.isPublished ? "published" : "draft").includes(lower)
    );
  }, [quizzes, debouncedSearch]);

  const filteredStudents = useMemo(() => {
    if (!debouncedSearch) return students;
    const lower = debouncedSearch.toLowerCase();
    return students.filter(s => 
      s.fullName.toLowerCase().includes(lower) || 
      s.email.toLowerCase().includes(lower) ||
      (s.phoneNumber && s.phoneNumber.toLowerCase().includes(lower)) ||
      (s.collegeName && s.collegeName.toLowerCase().includes(lower))
    );
  }, [students, debouncedSearch]);

  const filteredResults = useMemo(() => {
    if (!debouncedSearch) return results;
    const lower = debouncedSearch.toLowerCase();
    return results.filter(r => 
      (r.student?.fullName || "").toLowerCase().includes(lower) || 
      (r.student?.email || "").toLowerCase().includes(lower) || 
      (r.quiz?.title || "").toLowerCase().includes(lower) ||
      (r.percentage !== null && r.percentage.toString().includes(lower))
    );
  }, [results, debouncedSearch]);

  const openStudentHistory = (studentId: string) => {
    setSelectedStudentId(studentId);
    setIsHistoryDrawerOpen(true);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-black mb-2" size={24} />
          <p className="text-sm text-gray-500">Loading admin metrics…</p>
        </div>
        <StudentHistoryDrawer
          isOpen={isHistoryDrawerOpen}
          onClose={() => setIsHistoryDrawerOpen(false)}
          studentId={selectedStudentId}
        />
      </AdminLayout>
    );
  }

  const hasSearch = !!debouncedSearch;
  const hasAnyResults = filteredQuizzes.length > 0 || filteredStudents.length > 0 || filteredResults.length > 0;

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-black">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform overview and key metrics</p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search quizzes, students, results..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-black"
        />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
            className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col h-full"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500">{label}</p>
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                <Icon size={14} className="text-gray-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-black mb-1">{value}</p>
            <p className="text-xs text-gray-400 mt-auto">{delta}</p>
          </motion.div>
        ))}
      </div>

      {/* If searching, show all sections */}
      {hasSearch && !hasAnyResults && (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-500">No results found for "{searchTerm}"</p>
        </div>
      )}

      {(!hasSearch || filteredQuizzes.length > 0) && (
        <div className="mb-4">
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-black mb-4">Quiz Overview</h3>
            {filteredQuizzes.length === 0 && hasSearch ? (
              <div className="text-center text-xs text-gray-400 py-6">No quizzes found matching your search.</div>
            ) : filteredQuizzes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left column: first 5 quizzes */}
                <div className="space-y-3">
                  {filteredQuizzes.slice(0, 5).map((quiz) => (
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
                </div>
                {/* Right column: next 5 quizzes */}
                <div className="space-y-3">
                  {filteredQuizzes.slice(5, 10).map((quiz) => (
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
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Students section (only when searching) */}
      {hasSearch && filteredStudents.length > 0 && (
        <div className="mb-4">
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-black mb-4">Students</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStudents.slice(0, 6).map((student) => (
                <div key={student.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => openStudentHistory(student.id)}
                      className="text-left hover:underline"
                    >
                      <p className="text-sm font-medium text-black truncate">{student.fullName}</p>
                      <p className="text-xs text-gray-400 truncate">{student.email}</p>
                    </button>
                  </div>
                  {student.collegeName && (
                    <span className="text-xs text-gray-500 truncate max-w-[150px]">{student.collegeName}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent results */}
      {(!hasSearch || filteredResults.length > 0) && (
        <div className="bg-white border border-gray-100 rounded-xl overflow-x-auto">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-black">Recent Results</h3>
          </div>
          {filteredResults.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  {["User", "Quiz", "Score", "Percentage", "Date", "Result"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredResults.slice(0, 5).map((r) => {
                  const isCheating = r.cheatingDetected || r.attempt?.isCheating;
                  const passingScore = 35;
                  const passed = !isCheating && r.percentage !== null && r.percentage >= passingScore;
                  return (
                    <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-sm">
                        {r.student && (
                          <button
                            onClick={() => openStudentHistory(r.student.id)}
                            className="font-medium text-black hover:underline cursor-pointer"
                          >
                            {r.student.fullName || "Student"}
                          </button>
                        )}
                        {!r.student && <span className="text-gray-500">Student</span>}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{r.quiz?.title || "Quiz"}</td>
                      <td className="px-5 py-3 text-sm text-gray-700">
                        {!isCheating && r.score !== null ? `${r.score}/${r.quiz?.totalMarks || r.totalQuestions * 3}` : "-"}
                      </td>
                      <td className="px-5 py-3 text-sm font-semibold text-black">
                        {!isCheating && r.percentage !== null ? `${r.percentage}%` : "-"}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-400">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3">
                        {isCheating ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            Disqualified
                          </span>
                        ) : passed ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                            Passed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            Failed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : hasSearch ? (
            <div className="text-center text-xs text-gray-400 py-12">No results found matching your search.</div>
          ) : null}
        </div>
      )}

      <StudentHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        studentId={selectedStudentId}
      />
    </AdminLayout>
  );
}
