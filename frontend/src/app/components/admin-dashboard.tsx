"use client";
import React from "react";

import { useEffect, useState, useMemo } from "react";
import { AdminLayout } from "./admin-sidebar";
import {
  apiAdminGetQuizzes,
  apiAdminGetStudents,
  apiAdminGetResults,
  apiAdminGetQuizStats,
  apiAdminGetQuizResults,
  Quiz,
  StoredUser,
  QuizResult,
  QuizStats,
  QuizResultsItem,
} from "./api";
import { Users, BookOpen, BarChart2, Trophy, CheckCircle2, Clock, Loader2, Search, ChevronLeft, Download, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { useDebounce } from "./use-debounce";
import { StudentHistoryDrawer } from "./StudentHistoryDrawer";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";

function formatDateTime(value?: string | Date) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
}

export function AdminDashboard() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [students, setStudents] = useState<StoredUser[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Analytics state
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizStats, setQuizStats] = useState<QuizStats | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResultsItem[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [resultsSearch, setResultsSearch] = useState("");
  const [resultsSortBy, setResultsSortBy] = useState<"date" | "score">("date");
  const [resultsSortOrder, setResultsSortOrder] = useState<"ASC" | "DESC">("DESC");
  const debouncedResultsSearch = useDebounce(resultsSearch, 300);

  const fetchQuizAnalytics = async (quizId: string) => {
    setLoadingAnalytics(true);
    try {
      const [stats, results] = await Promise.all([
        apiAdminGetQuizStats(quizId),
        apiAdminGetQuizResults(quizId, { sortBy: resultsSortBy, sortOrder: resultsSortOrder }),
      ]);
      setQuizStats(stats);
      setQuizResults(results);
    } catch (err) {
      console.error("Failed to load quiz analytics", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchQuizResults = async (quizId: string) => {
    try {
      const results = await apiAdminGetQuizResults(quizId, {
        q: debouncedResultsSearch,
        sortBy: resultsSortBy,
        sortOrder: resultsSortOrder,
      });
      setQuizResults(results);
    } catch (err) {
      console.error("Failed to load quiz results", err);
    }
  };

  useEffect(() => {
    if (selectedQuizId) {
      fetchQuizResults(selectedQuizId);
    }
  }, [selectedQuizId, debouncedResultsSearch, resultsSortBy, resultsSortOrder]);

  const exportToCSV = () => {
    if (!quizResults.length || !quizStats) return;
    const headers = ["Student Name", "Email", "Score", "Percentage", "Attempt Date"];
    const csvContent = [
      headers.join(","),
      ...quizResults.map(row => [
        `"${row.studentName}"`,
        `"${row.email}"`,
        row.score,
        row.percentage,
        `"${formatDateTime(row.attemptDate)}"`,
      ].join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${quizStats.overview.quizName.replace(/[^a-z0-9]/gi, "_")}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  const handleOpenAnalytics = (quiz: Quiz) => {
    setSelectedQuizId(quiz.id);
    fetchQuizAnalytics(quiz.id);
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
          <div
            key={label}
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
          </div>
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
                    <div 
                      key={quiz.id} 
                      className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
                      onClick={() => handleOpenAnalytics(quiz)}
                    >
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
                    <div 
                      key={quiz.id} 
                      className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
                      onClick={() => handleOpenAnalytics(quiz)}
                    >
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

      {/* Quiz Analytics Sheet */}
      {selectedQuizId && (
        <Sheet open={!!selectedQuizId} onOpenChange={(open) => !open && setSelectedQuizId(null)}>
          <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
            <SheetHeader className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => setSelectedQuizId(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <SheetTitle className="text-xl font-bold">Quiz Analytics</SheetTitle>
              </div>
              <SheetDescription>Detailed performance and participation insights</SheetDescription>
            </SheetHeader>

            {loadingAnalytics ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-black mb-2" size={24} />
                <p className="text-sm text-gray-500">Loading quiz analytics…</p>
              </div>
            ) : quizStats ? (
              <>
                {/* Overview Stats */}
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4">Quiz Overview</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Quiz Name</p>
                      <p className="text-sm font-medium text-black">{quizStats.overview.quizName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Questions</p>
                      <p className="text-sm font-medium text-black">{quizStats.overview.totalQuestions}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Published</p>
                      <p className="text-sm font-medium text-black">{quizStats.overview.publishedStatus ? "Yes" : "No"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Creation Date</p>
                      <p className="text-sm font-medium text-black">{formatDateTime(quizStats.overview.creationDate)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Users size={16} className="text-gray-500" />
                        <p className="text-xs text-gray-500">Students Attempted</p>
                      </div>
                      <p className="text-2xl font-bold text-black">{quizStats.participation.totalStudentsAttempted}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <BarChart2 size={16} className="text-gray-500" />
                        <p className="text-xs text-gray-500">Total Attempts</p>
                      </div>
                      <p className="text-2xl font-bold text-black">{quizStats.participation.totalAttempts}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 size={16} className="text-gray-500" />
                        <p className="text-xs text-gray-500">Completion Rate</p>
                      </div>
                      <p className="text-2xl font-bold text-black">{quizStats.participation.completionRate}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">Average Score</p>
                      <p className="text-2xl font-bold text-blue-600">{quizStats.performance.averageScore}%</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">Highest Score</p>
                      <p className="text-2xl font-bold text-green-600">{quizStats.performance.highestScore}%</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">Lowest Score</p>
                      <p className="text-2xl font-bold text-red-600">{quizStats.performance.lowestScore}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">Pass Count</p>
                      <p className="text-2xl font-bold text-green-600">{quizStats.performance.passCount}</p>
                      <p className="text-xs text-gray-400 mt-1">{quizStats.performance.passPercentage}% pass rate</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">Fail Count</p>
                      <p className="text-2xl font-bold text-red-600">{quizStats.performance.failCount}</p>
                    </div>
                  </div>
                </div>

                {/* Student Results */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-black">Student Results</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setResultsSortBy(resultsSortBy === "date" ? "score" : "date")}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        {resultsSortBy === "date" ? <Calendar size={14} /> : <Trophy size={14} />}
                        {resultsSortBy === "date" ? "Date" : "Score"}
                      </button>
                      <button
                        onClick={() => {
                          const newSortOrder = resultsSortOrder === "DESC" ? "ASC" : "DESC";
                          setResultsSortOrder(newSortOrder);
                        }}
                        className="flex items-center justify-center w-8 h-8 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        {resultsSortOrder === "DESC" ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                      </button>
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Search students..."
                          value={resultsSearch}
                          onChange={(e) => setResultsSearch(e.target.value)}
                          className="pl-10 pr-3 py-2 text-xs text-black placeholder-gray-500 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-all"
                        />
                      </div>
                      <button
                        onClick={exportToCSV}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Download size={14} />
                        Export CSV
                      </button>
                    </div>
                  </div>

                  {quizResults.length === 0 ? (
                    <div className="bg-white border border-gray-100 rounded-xl py-16 text-center text-sm text-gray-400">
                      No student results yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {quizResults.map((result, idx) => (
                        <div key={idx} className="bg-white border border-gray-100 rounded-xl p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-medium text-black">{result.studentName}</p>
                              <p className="text-xs text-gray-500">{result.email}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-black">
                                {result.percentage}%
                              </p>
                              <p className="text-xs text-gray-500">
                                {result.score}/{result.totalMarks}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>Attempted: {formatDateTime(result.attemptDate)}</span>
                            {result.percentage >= 35 ? (
                              <span className="text-green-600 font-medium">Passed</span>
                            ) : (
                              <span className="text-red-600 font-medium">Failed</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </SheetContent>
        </Sheet>
      )}
    </AdminLayout>
  );
}
