"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Loader2,
  Trophy,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  Clock,
  Search,
} from "lucide-react";
import {
  apiAdminGetUserDetails,
  apiAdminGetUserHistory,
  UserDetailsResponse,
  UserHistoryItem,
  getErrorMessage,
} from "./api";
import { useDebounce } from "./use-debounce";

interface StudentHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string | null;
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString();
}

export function StudentHistoryDrawer({
  isOpen,
  onClose,
  studentId,
}: StudentHistoryDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<UserDetailsResponse | null>(null);
  const [history, setHistory] = useState<UserHistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [sortBy, setSortBy] = useState<"date" | "score">("date");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  useEffect(() => {
    if (isOpen && studentId) {
      loadData();
    }
  }, [isOpen, studentId]);

  useEffect(() => {
    if (isOpen && studentId) {
      loadHistory();
    }
  }, [isOpen, studentId, debouncedSearch, sortBy, sortOrder]);

  const loadData = async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const data = await apiAdminGetUserDetails(studentId);
      setDetails(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!studentId) return;
    try {
      const data = await apiAdminGetUserHistory(studentId, {
        q: debouncedSearch || undefined,
        sortBy,
        sortOrder,
      });
      setHistory(data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredHistory = history;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50">
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 h-full w-full sm:max-w-2xl lg:max-w-4xl bg-white shadow-2xl flex flex-col"
          >
            {/* Sticky Header */}
            <div className="p-6 border-b border-gray-100 bg-white shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-black">Student History</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="animate-spin text-black mb-4" size={32} />
                  <p className="text-sm text-gray-500">Loading student history...</p>
                </div>
              ) : details ? (
                <div className="space-y-6">
                  {/* Student Info */}
                  <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                      <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold shrink-0">
                        {details.student.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold text-black truncate">
                          {details.student.fullName}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">{details.student.email}</p>
                        {details.student.phoneNumber && (
                          <p className="text-sm text-gray-500 truncate">{details.student.phoneNumber}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                    <div className="bg-white border border-gray-100 rounded-xl p-3 sm:p-4">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <Trophy size={14} />
                        <span className="text-[10px] sm:text-xs">Attempts</span>
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-black">
                        {details.stats.totalQuizzesAttempted}
                      </p>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl p-3 sm:p-4">
                      <div className="flex items-center gap-2 text-green-600 mb-1">
                        <CheckCircle2 size={14} />
                        <span className="text-[10px] sm:text-xs">Passed</span>
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">
                        {details.stats.totalPassed}
                      </p>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl p-3 sm:p-4">
                      <div className="flex items-center gap-2 text-red-600 mb-1">
                        <XCircle size={14} />
                        <span className="text-[10px] sm:text-xs">Failed</span>
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-red-600">
                        {details.stats.totalFailed}
                      </p>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl p-3 sm:p-4">
                      <div className="flex items-center gap-2 text-amber-600 mb-1">
                        <AlertTriangle size={14} />
                        <span className="text-[10px] sm:text-xs">Disqualified</span>
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-amber-600">
                        {details.stats.totalDisqualified}
                      </p>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl p-3 sm:p-4 col-span-2 sm:col-span-1">
                      <div className="flex items-center gap-2 text-blue-600 mb-1">
                        <Trophy size={14} />
                        <span className="text-[10px] sm:text-xs">Avg Score</span>
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">
                        {details.stats.averageScore}%
                      </p>
                    </div>
                  </div>

                  {/* Search & Sort */}
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by quiz name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-black"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSortBy(sortBy === "date" ? "score" : "date")}
                        className="flex-1 sm:flex-none px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Sort: {sortBy === "date" ? "Date" : "Score"}
                      </button>
                      <button
                        onClick={() =>
                          setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC")
                        }
                        className="flex-1 sm:flex-none px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {sortOrder === "ASC" ? "Asc" : "Desc"}
                      </button>
                    </div>
                  </div>

                  {/* History List */}
                  {filteredHistory.length === 0 ? (
                    <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-sm text-gray-500">
                      No quiz attempts found for this student.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredHistory.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white border border-gray-100 rounded-xl p-4 sm:p-6"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <h4 className="text-base font-bold text-black">{item.quizName}</h4>
                                <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full font-medium">
                                  Attempt {item.attemptNumber}
                                </span>
                                {item.isRetake && (
                                  <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                                    Retake
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Calendar size={12} />
                                  Started: {formatDateTime(item.startedAt)}
                                </div>
                                {item.submittedAt && (
                                  <div className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    Submitted: {formatDateTime(item.submittedAt)}
                                  </div>
                                )}
                                {item.completionTimeSeconds && (
                                  <div className="flex items-center gap-1">
                                    <Clock size={12} />
                                    Duration: {formatDuration(item.completionTimeSeconds)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="sm:text-right shrink-0">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                                  item.status === "Passed"
                                    ? "bg-green-50 text-green-700 border border-green-200"
                                    : item.status === "Failed"
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {item.status}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                            <div className="bg-gray-50 rounded-lg p-2.5">
                              <p className="text-[10px] text-gray-500 mb-0.5">Score</p>
                              <p className="text-sm sm:text-base font-bold text-black">
                                {item.score !== null ? item.score : "-"}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2.5">
                              <p className="text-[10px] text-gray-500 mb-0.5">Percentage</p>
                              <p className="text-sm sm:text-base font-bold text-black">
                                {item.percentage !== null ? `${item.percentage}%` : "-"}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2.5">
                              <p className="text-[10px] text-gray-500 mb-0.5">Correct</p>
                              <p className="text-sm sm:text-base font-bold text-green-600">
                                {item.correctAnswers !== null ? item.correctAnswers : "-"}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2.5">
                              <p className="text-[10px] text-gray-500 mb-0.5">Wrong</p>
                              <p className="text-sm sm:text-base font-bold text-red-600">
                                {item.wrongAnswers !== null ? item.wrongAnswers : "-"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <p className="text-sm text-gray-500">Failed to load student history.</p>
                </div>
              )}
            </div>

            {/* Sticky Footer */}
            <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex justify-end">
              <button
                onClick={onClose}
                className="w-full sm:w-auto min-h-[44px] flex items-center justify-center px-6 py-2 bg-black hover:bg-gray-900 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Close Drawer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
