"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "./admin-sidebar";
import {
  apiAdminGetStudents,
  apiAdminGetResults,
  apiAdminGetUserDetails,
  apiAdminGetUserHistory,
  StoredUser,
  QuizResult,
  UserDetailsResponse,
  UserHistoryItem,
} from "./api";
import { motion, AnimatePresence } from "motion/react";
import { Search, Trophy, Calendar, Loader2, X, ChevronLeft, ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import { useDebounce } from "./use-debounce";

interface EnrichedStudent extends StoredUser {
  attempts: number;
  avgScore: number;
}

function formatJoinedDate(createdAt?: string) {
  if (!createdAt) return "Unknown";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString();
}

function formatDateTime(dateString?: string | Date) {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
}

function getStatusColor(status: string) {
  if (status === "Passed") return "text-green-600 bg-green-50 border-green-200";
  if (status === "Failed") return "text-red-600 bg-red-50 border-red-200";
  if (status === "Disqualified") return "text-red-700 bg-red-50 border-red-200";
  return "text-gray-600 bg-gray-50 border-gray-200";
}

export function AdminUsers() {
  const [students, setStudents] = useState<EnrichedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // User details sheet state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetailsResponse | null>(null);
  const [userHistory, setUserHistory] = useState<UserHistoryItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historySortBy, setHistorySortBy] = useState<"date" | "score">("date");
  const [historySortOrder, setHistorySortOrder] = useState<"ASC" | "DESC">("DESC");
  const debouncedHistorySearch = useDebounce(historySearch, 300);

  useEffect(() => {
    async function loadData() {
      try {
        const [studentsData, resultsData] = await Promise.all([
          apiAdminGetStudents(),
          apiAdminGetResults(),
        ]);

        const enriched = studentsData.map((student) => {
          const studentResults = resultsData.filter((r) => r.studentId === student.id);
          const attempts = studentResults.length;
          const avgScore =
            attempts > 0
              ? Math.round(studentResults.reduce((sum, r) => sum + Number(r.percentage), 0) / attempts)
              : 0;

          return {
            ...student,
            attempts,
            avgScore,
          };
        });

        setStudents(enriched);
      } catch (err) {
        console.error("Failed to load users analytics", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const fetchUserDetails = async (userId: string) => {
    setLoadingDetails(true);
    try {
      const details = await apiAdminGetUserDetails(userId);
      setUserDetails(details);
      // Fetch initial history
      const history = await apiAdminGetUserHistory(userId);
      setUserHistory(history);
    } catch (err) {
      console.error("Failed to load user details", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchUserHistory = async (userId: string, searchQuery?: string, sortBy?: "date" | "score", sortOrder?: "ASC" | "DESC") => {
    try {
      const history = await apiAdminGetUserHistory(userId, { q: searchQuery, sortBy, sortOrder });
      setUserHistory(history);
    } catch (err) {
      console.error("Failed to load user history", err);
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      fetchUserHistory(selectedUserId, debouncedHistorySearch, historySortBy, historySortOrder);
    }
  }, [selectedUserId, debouncedHistorySearch, historySortBy, historySortOrder]);

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    fetchUserDetails(userId);
  };

  const filtered = students.filter(
    (u) =>
      (u.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-black">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">{students.length} registered students</p>
        </div>
      </div>

      {/* Local Search (for users page only) */}
      <div className="relative mb-6">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-[500px] pl-12 pr-4 py-3 text-black placeholder-gray-500 bg-white border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-all"
          placeholder="Search students, emails..."
        />
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-black mb-2" size={24} />
          <p className="text-sm text-gray-500">Loading student list…</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  {["User", "Email", "Attempts", "Avg Score", "Joined"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, i) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => handleUserClick(user.id)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                          {(user.fullName || "S")[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-black">{user.fullName || "Student"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{user.email}</td>

                    <td className="px-5 py-3.5 text-sm text-gray-700 font-semibold">{user.attempts}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-gray-700 font-semibold">{user.avgScore}%</span>
                        <Trophy size={11} className="text-gray-300" />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={11} />
                        {formatJoinedDate(user.createdAt)}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400">No users found matching "{search}"</div>
            )}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((user, i) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white border border-gray-100 rounded-xl p-4 cursor-pointer"
                onClick={() => handleUserClick(user.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
                      {(user.fullName || "S")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-black">{user.fullName || "Student"}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 text-xs text-gray-500">
                  <span>Attempts: <span className="font-semibold text-black">{user.attempts}</span></span>
                  <span>Avg: <span className="font-semibold text-black">{user.avgScore}%</span></span>
                  <span>Joined: {formatJoinedDate(user.createdAt)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* User Details Sheet */}
      <AnimatePresence>
        {selectedUserId && (
          <Sheet open={!!selectedUserId} onOpenChange={(open) => !open && setSelectedUserId(null)}>
            <SheetContent side="right" className="w-full sm:w-3/4 md:max-w-2xl overflow-y-auto p-0">
              <SheetHeader className="mb-0 p-4 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={() => setSelectedUserId(null)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <SheetTitle className="text-xl font-bold">User Details</SheetTitle>
                </div>
                <SheetDescription>Complete profile and quiz history</SheetDescription>
              </SheetHeader>

              <div className="p-6">
                {loadingDetails ? (
                  <div className="py-20 flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-black mb-2" size={24} />
                    <p className="text-sm text-gray-500">Loading user details…</p>
                  </div>
                ) : userDetails ? (
                  <>
                    {/* Profile Info */}
                    <div className="bg-gray-50 rounded-xl p-6 mb-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600">
                          {(userDetails.student.fullName || "S")[0].toUpperCase()}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-black">{userDetails.student.fullName}</h2>
                          <p className="text-sm text-gray-500">{userDetails.student.email}</p>
                          <span className="inline-block mt-1 text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                            {userDetails.student.role}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-xs text-gray-500 mb-1">Total Quizzes Attempted</p>
                          <p className="text-2xl font-bold text-black">{userDetails.stats.totalQuizzesAttempted}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-xs text-green-600 mb-1">Passed</p>
                          <p className="text-2xl font-bold text-green-600">{userDetails.stats.totalPassed}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-xs text-red-600 mb-1">Failed</p>
                          <p className="text-2xl font-bold text-red-600">{userDetails.stats.totalFailed}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-xs text-amber-600 mb-1">Disqualified</p>
                          <p className="text-2xl font-bold text-amber-600">{userDetails.stats.totalDisqualified}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-xs text-blue-600 mb-1">Average Score</p>
                          <p className="text-2xl font-bold text-blue-600">{userDetails.stats.averageScore}%</p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Registration Date</p>
                        <p className="text-sm text-black">{formatJoinedDate(userDetails.student.createdAt)}</p>
                        <p className="text-xs text-gray-500 mt-2 mb-1">Last Activity</p>
                        <p className="text-sm text-black">{formatDateTime(userDetails.stats.lastActivity)}</p>
                      </div>
                    </div>

                    {/* Exam History */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-black">Exam History</h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setHistorySortBy(historySortBy === "date" ? "score" : "date")}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            {historySortBy === "date" ? <Calendar size={14} /> : <Trophy size={14} />}
                            {historySortBy === "date" ? "Date" : "Score"}
                          </button>
                          <button
                            onClick={() => {
                              const newSortOrder = historySortOrder === "DESC" ? "ASC" : "DESC";
                              setHistorySortOrder(newSortOrder);
                            }}
                            className="flex items-center justify-center w-8 h-8 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            {historySortOrder === "DESC" ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                          </button>
                          <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                              type="text"
                              placeholder="Search quizzes..."
                              value={historySearch}
                              onChange={(e) => setHistorySearch(e.target.value)}
                              className="pl-10 pr-3 py-2 text-xs text-black placeholder-gray-500 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-all"
                            />
                        </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {userHistory.length === 0 ? (
                          <div className="bg-white border border-gray-100 rounded-xl py-12 text-center text-sm text-gray-400">
                            No quiz attempts yet
                          </div>
                        ) : (
                          userHistory.map((item, idx) => (
                            <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-5">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-black">{item.quizName}</h4>
                                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                                    Attempt {item.attemptNumber}
                                  </span>
                                  {item.isRetake && (
                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                      Retake
                                    </span>
                                  )}
                                </div>
                                <span className={`text-xs px-2.5 py-1 rounded-full border ${getStatusColor(item.status)}`}>
                                  {item.status}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                                <div>
                                  <p className="text-xs text-gray-500">Started</p>
                                  <p className="text-gray-700">{formatDateTime(item.startedAt)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Submitted</p>
                                  <p className="text-gray-700">{item.submittedAt ? formatDateTime(item.submittedAt) : "-"}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Duration</p>
                                  <p className="text-gray-700">{item.completionTimeSeconds ? `${Math.floor(item.completionTimeSeconds / 60)}m ${item.completionTimeSeconds % 60}s` : "-"}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Score</p>
                                  <p className="text-gray-700">{item.score !== null ? item.score : "-"}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Percentage</p>
                                  <p className="text-gray-700 font-medium">{item.percentage !== null ? `${item.percentage}%` : "-"}</p>
                                </div>
                                <div className="flex gap-4">
                                  <div>
                                    <p className="text-xs text-gray-500">Correct</p>
                                    <p className="text-green-600 font-medium">{item.correctAnswers !== null ? item.correctAnswers : "-"}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Wrong</p>
                                    <p className="text-red-600 font-medium">{item.wrongAnswers !== null ? item.wrongAnswers : "-"}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
