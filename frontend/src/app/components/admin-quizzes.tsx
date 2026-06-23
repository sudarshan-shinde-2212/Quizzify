"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "./admin-sidebar";
import {
  apiAdminGetQuizzes,
  apiAdminCreateQuiz,
  apiAdminUpdateQuiz,
  apiAdminDeleteQuiz,
  apiAdminPublishQuiz,
  apiAdminGetQuizStats,
  apiAdminGetQuizResults,
  apiAdminUpdateQuizVisibility,
  apiAdminGetQuizSettings,
  apiAdminUpdateQuizSettings,
  getErrorMessage,
  Quiz,
  QuizStats,
  QuizResultsItem,
  QuizSettings,
} from "./api";
import { ConfirmModal } from "./ui/confirm-modal";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar, Plus, Edit2, Trash2, Eye, Clock, Trophy, X, Loader2,
  Play, PowerOff, Sparkles, FileQuestion, BarChart2, ChevronLeft, Search,
  Download, Users, CheckCircle2, TrendingUp, TrendingDown, Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import { useDebounce } from "./use-debounce";

interface QuizFormModalProps {
  quiz?: Quiz;
  onClose: () => void;
  onRefresh: () => void | Promise<void>;
}

function toDateInputValue(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function toIsoDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

function formatQuizDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

function formatDateTime(value?: string | Date) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
}

function QuizFormModal({ quiz, onClose, onRefresh }: QuizFormModalProps) {
  const [form, setForm] = useState({
    title: quiz?.title ?? "",
    description: quiz?.description ?? "",
    instructions: quiz?.instructions ?? "",
    duration: quiz?.durationInMinutes ?? 30,
    totalMarks: quiz?.totalMarks ?? 10,
    questionCount: quiz?.questionCount ?? 10,
    negativeMarks: quiz?.negativeMarks ?? 0,
    startDate: toDateInputValue(quiz?.startDate),
    endDate: toDateInputValue(quiz?.endDate),
    visibility: quiz?.visibility ?? "private",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Live counters – only meaningful for existing quiz with questions
  const marksPerQ = form.questionCount > 0
    ? Number((form.totalMarks / form.questionCount).toFixed(2))
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const durationInMinutes = Number(form.duration);
    const totalMarks = Number(form.totalMarks);
    const questionCount = Number(form.questionCount);
    const negativeMarks = Number(form.negativeMarks);
    const startTime = new Date(`${form.startDate}T00:00:00.000Z`).getTime();
    const endTime = new Date(`${form.endDate}T00:00:00.000Z`).getTime();

    if (!Number.isFinite(durationInMinutes) || durationInMinutes < 1) {
      setError("Duration must be at least 1 minute.");
      setLoading(false);
      return;
    }

    if (!Number.isFinite(totalMarks) || totalMarks < 1) {
      setError("Total marks must be at least 1.");
      setLoading(false);
      return;
    }

    if (!Number.isInteger(questionCount) || questionCount < 1) {
      setError("Number of questions must be a whole number greater than 0.");
      setLoading(false);
      return;
    }

    if (negativeMarks < 0 || negativeMarks > 99.99) {
      setError("Negative marks must be between 0 and 99.99.");
      setLoading(false);
      return;
    }

    if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
      setError("Please choose valid start and end dates.");
      setLoading(false);
      return;
    }

    if (startTime > endTime) {
      setError("End date must be after or equal to start date.");
      setLoading(false);
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      instructions: form.instructions.trim(),
      startDate: toIsoDate(form.startDate),
      endDate: toIsoDate(form.endDate),
      durationInMinutes,
      totalMarks,
      questionCount,
      negativeMarks,
      visibility: form.visibility,
    };

    try {
      if (quiz) {
        await apiAdminUpdateQuiz(quiz.id, payload);
      } else {
        await apiAdminCreateQuiz(payload);
      }
      await onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to save quiz. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4 overflow-y-auto py-8">
      <motion.div
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.97, opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-black">{quiz ? "Edit Quiz" : "Create New Quiz"}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-black">
            <X size={18} />
          </button>
        </div>

        {/* Live counters */}
        <div className="flex gap-3 mb-4">
          {[
            { label: "Questions", value: form.questionCount },
            { label: "Total Marks", value: form.totalMarks },
            { label: "Marks / Q", value: marksPerQ },
          ].map(({ label, value }) => (
            <div key={label} className="flex-1 bg-gray-50 border border-gray-100 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-sm font-bold text-black">{value}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Row 1: Title (full width) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-700">Quiz Title <span className="text-red-500">*</span></label>
              <span className="text-[10px] text-gray-400">{form.title.length}/100</span>
            </div>
            <input
              required
              maxLength={100}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
              placeholder="e.g. JavaScript Advanced Concepts"
            />
          </div>

          {/* Row 2: Description (full width) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-700">Description <span className="text-red-500">*</span></label>
              <span className="text-[10px] text-gray-400">{form.description.length}/500</span>
            </div>
            <textarea
              required
              maxLength={500}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black resize-none"
              rows={2}
              placeholder="Brief description of the quiz..."
            />
          </div>

          {/* Row 3: Instructions (full width, optional) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-700">Instructions <span className="text-gray-400 font-normal">(Optional)</span></label>
              <span className="text-[10px] text-gray-400">{form.instructions.length}/1000</span>
            </div>
            <textarea
              maxLength={1000}
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black resize-none"
              rows={2}
              placeholder="Directions for candidate..."
            />
          </div>

          {/* Row 4: Start Date | End Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>
          </div>

          {/* Row 5: Duration | Total Marks | No. of Questions */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Duration (min) <span className="text-red-500">*</span></label>
              <input
                type="number"
                required
                min={1}
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: +e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Total Marks <span className="text-red-500">*</span></label>
              <input
                type="number"
                required
                min={1}
                step="0.01"
                value={form.totalMarks}
                onChange={(e) => setForm({ ...form, totalMarks: +e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">No. of Questions <span className="text-red-500">*</span></label>
              <input
                type="number"
                required
                min={1}
                step={1}
                value={form.questionCount}
                onChange={(e) => setForm({ ...form, questionCount: Math.floor(+e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>
          </div>

          {/* Row 6: Negative Marks Per Wrong Answer */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Negative Marks Per Wrong Answer
              <span className="ml-1 text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              id="quiz-negative-marks"
              type="number"
              min={0}
              max={99.99}
              step={0.01}
              value={form.negativeMarks}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setForm({ ...form, negativeMarks: isNaN(v) ? 0 : Math.max(0, parseFloat(v.toFixed(2))) });
              }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
              placeholder="e.g. 0.25"
              aria-label="Negative marks deducted per wrong answer"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Marks deducted for each incorrect answer. Use 0 to disable negative marking.
            </p>
          </div>

          {/* Row 7: Quiz Visibility */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Quiz Visibility <span className="text-red-500">*</span>
            </label>
            <select
              value={form.visibility}
              onChange={(e) => setForm({ ...form, visibility: e.target.value as "public" | "private" })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
            >
              <option value="private">Private (No leaderboard)</option>
              <option value="public">Public (Show leaderboard)</option>
            </select>
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-900 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {quiz ? "Save Changes" : "Create Quiz"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function AdminQuizzes() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editQuiz, setEditQuiz] = useState<Quiz | undefined>();
  const [quizSearch, setQuizSearch] = useState("");
  const debouncedQuizSearch = useDebounce(quizSearch, 300);

  // Analytics sheet state
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizStats, setQuizStats] = useState<QuizStats | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResultsItem[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [resultsSearch, setResultsSearch] = useState("");
  const [resultsSortBy, setResultsSortBy] = useState<"date" | "score">("date");
  const [resultsSortOrder, setResultsSortOrder] = useState<"ASC" | "DESC">("DESC");
  const debouncedResultsSearch = useDebounce(resultsSearch, 300);

  // Quiz settings sheet state
  const [settingsQuizId, setSettingsQuizId] = useState<string | null>(null);
  const [quizSettings, setQuizSettings] = useState<QuizSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const loadQuizzes = async () => {
    try {
      const data = await apiAdminGetQuizzes();
      setAllQuizzes(data);
      setQuizzes(data);
    } catch (err) {
      console.error("Failed to fetch quizzes", err);
    } finally {
      setLoading(false);
    }
  };

  const openQuizSettings = async (quiz: Quiz, e: React.MouseEvent) => {
    e.stopPropagation();
    setSettingsQuizId(quiz.id);
    setLoadingSettings(true);
    try {
      const settings = await apiAdminGetQuizSettings(quiz.id);
      setQuizSettings(settings);
    } catch (err) {
      console.error("Failed to load quiz settings", err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const saveQuizSettings = async () => {
    if (!settingsQuizId || !quizSettings) return;
    setSavingSettings(true);
    try {
      await apiAdminUpdateQuizSettings(settingsQuizId, quizSettings);
      await loadQuizzes();
      setSettingsQuizId(null);
    } catch (err) {
      console.error("Failed to save quiz settings", err);
      alert(getErrorMessage(err, "Failed to save quiz settings"));
    } finally {
      setSavingSettings(false);
    }
  };

  // Filter quizzes based on search
  useEffect(() => {
    if (!debouncedQuizSearch) {
      setQuizzes(allQuizzes);
    } else {
      const filtered = allQuizzes.filter(q => 
        q.title.toLowerCase().includes(debouncedQuizSearch.toLowerCase()) ||
        q.description?.toLowerCase().includes(debouncedQuizSearch.toLowerCase())
      );
      setQuizzes(filtered);
    }
  }, [debouncedQuizSearch, allQuizzes]);

  useEffect(() => {
    loadQuizzes();
  }, []);

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

  const handleOpenAnalytics = (quiz: Quiz, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedQuizId(quiz.id);
    fetchQuizAnalytics(quiz.id);
  };

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

  const openCreate = () => { setEditQuiz(undefined); setShowModal(true); };
  const openEdit = (q: Quiz) => { setEditQuiz(q); setShowModal(true); };

  // ── Delete confirmation ─────────────────────────────────────────────────────
  const [deleteQuizId, setDeleteQuizId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteQuizId) return;
    setIsDeleting(true);
    try {
      await apiAdminDeleteQuiz(deleteQuizId);
      loadQuizzes();
    } catch (err) {
      console.error("Failed to delete quiz", err);
      alert("Delete failed.");
    } finally {
      setIsDeleting(false);
      setDeleteQuizId(null);
    }
  };

  // ── Publish / Unpublish confirmation ────────────────────────────────────────
  const [publishConfirm, setPublishConfirm] = useState<Quiz | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleTogglePublish = async () => {
    if (!publishConfirm) return;
    setIsPublishing(true);
    try {
      await apiAdminPublishQuiz(publishConfirm.id, !publishConfirm.isPublished);
      loadQuizzes();
    } catch (err) {
      console.error("Failed to publish/unpublish quiz", err);
      alert(getErrorMessage(err, "Status update failed."));
    } finally {
      setIsPublishing(false);
      setPublishConfirm(null);
    }
  };

  // ── Toggle Visibility ──────────────────────────────────────────────────────
  const handleToggleVisibility = async (quiz: Quiz) => {
    try {
      await apiAdminUpdateQuizVisibility(
        quiz.id,
        quiz.visibility === "public" ? "private" : "public"
      );
      loadQuizzes();
    } catch (err) {
      console.error("Failed to update quiz visibility", err);
      alert(getErrorMessage(err, "Visibility update failed."));
    }
  };

  const getQuizStatus = (quiz: Quiz): "live" | "upcoming" | "closed" | "draft" => {
    if (!quiz.isPublished) return "draft";
    const now = new Date();
    const start = new Date(quiz.startDate);
    const end = new Date(quiz.endDate);
    if (now < start) return "upcoming";
    if (now > end) return "closed";
    return "live";
  };

  const statusColors: Record<string, string> = {
    live: "bg-green-50 text-green-700 border-green-200",
    upcoming: "bg-blue-50 text-blue-700 border-blue-200",
    closed: "bg-gray-50 text-gray-500 border-gray-200",
    draft: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-black">Quizzes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""}</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Local Search (for quizzes page only) */}
          <div className="relative flex-1 sm:flex-none sm:w-[400px]">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search quizzes..."
              value={quizSearch}
              onChange={(e) => setQuizSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-black placeholder-gray-500 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-all"
            />
          </div>
          <button
            onClick={() => router.push("/admin/ai-quiz")}
            className="flex items-center gap-1.5 border border-gray-200 bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Sparkles size={15} className="text-purple-500" />
            AI Quiz Generator
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900"
          >
            <Plus size={15} />
            Create Quiz
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-black mb-2" size={24} />
          <p className="text-sm text-gray-500">Loading quizzes list…</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl py-16 text-center text-gray-400">
          No quizzes found. Click Create Quiz to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz, i) => {
            const status = getQuizStatus(quiz);
            const color = statusColors[status] || "bg-gray-50 text-gray-500 border-gray-200";

            return (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white border border-gray-100 rounded-xl p-5 flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-black">{quiz.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${color}`}>
                      {status.toUpperCase()}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${
                        quiz.visibility === "public"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                      onClick={() => handleToggleVisibility(quiz)}
                      title="Click to toggle visibility"
                    >
                      {quiz.visibility === "public" ? "PUBLIC" : "PRIVATE"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-1">{quiz.description}</p>
                  <div className="flex gap-4">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={11} /> {quiz.durationInMinutes}m</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Trophy size={11} /> {quiz.totalMarks} marks</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><FileQuestion size={11} /> {quiz.questionCount} Qs</span>
                    {quiz.negativeMarks > 0 && (
                      <span className="text-xs text-red-500 flex items-center gap-1">-{quiz.negativeMarks} neg</span>
                    )}
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar size={11} /> {formatQuizDate(quiz.startDate)} - {formatQuizDate(quiz.endDate)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => handleOpenAnalytics(quiz, e)}
                    title="View Quiz Analytics"
                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    <BarChart2 size={15} />
                  </button>
                  <button
                    onClick={(e) => openQuizSettings(quiz, e)}
                    title="Quiz Settings"
                    className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Settings size={15} />
                  </button>
                  <button
                    onClick={() => setPublishConfirm(quiz)}
                    title={quiz.isPublished ? "Unpublish Quiz (set to draft)" : "Publish Quiz"}
                    className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    {quiz.isPublished ? <PowerOff size={15} /> : <Play size={15} />}
                  </button>
                  <button
                    onClick={() => router.push(`/admin/questions?quizId=${quiz.id}`)}
                    title="Manage Questions"
                    className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    onClick={() => openEdit(quiz)}
                    title="Edit Settings"
                    className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteQuizId(quiz.id)}
                    title="Delete Quiz"
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <QuizFormModal quiz={editQuiz} onClose={() => setShowModal(false)} onRefresh={loadQuizzes} />
        )}
      </AnimatePresence>

      {/* Quiz Analytics Sheet */}
      <AnimatePresence>
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
                                <p className="text-lg font-bold text-black">{result.percentage}%</p>
                                <p className="text-xs text-gray-500">Score: {result.score}</p>
                              </div>
                            </div>
                            <p className="text-xs text-gray-400">
                              Attempted: {formatDateTime(result.attemptDate)}
                            </p>
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
      </AnimatePresence>

      {/* Quiz Settings Sheet */}
      <AnimatePresence>
        {settingsQuizId && (
          <Sheet open={!!settingsQuizId} onOpenChange={(open) => !open && setSettingsQuizId(null)}>
            <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
              <SheetHeader className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setSettingsQuizId(null)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <SheetTitle className="text-xl font-bold">Quiz Settings</SheetTitle>
                </div>
                <SheetDescription>Customize quiz-specific settings</SheetDescription>
              </SheetHeader>

              {loadingSettings ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin text-black mb-2" size={24} />
                  <p className="text-sm text-gray-500">Loading quiz settings…</p>
                </div>
              ) : quizSettings ? (
                <div className="space-y-6">
                  {/* Allow Retakes */}
                  <div className="bg-gray-50 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-black">Allow Retakes</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Let students attempt the quiz multiple times
                        </p>
                      </div>
                      <button
                        onClick={() => setQuizSettings({ 
                          ...quizSettings, 
                          allowRetakes: !quizSettings.allowRetakes, 
                          maxRetakes: !quizSettings.allowRetakes ? 0 : (quizSettings.maxRetakes || 1) 
                        })}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          quizSettings.allowRetakes ? "bg-black" : "bg-gray-300"
                        }`}
                      >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          quizSettings.allowRetakes ? "translate-x-6" : "translate-x-0"
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Max Retakes */}
                  {quizSettings.allowRetakes && (
                    <div className="bg-gray-50 rounded-xl p-5">
                      <div>
                        <h3 className="text-sm font-semibold text-black">Maximum Retakes</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Number of additional attempts allowed after the first attempt
                        </p>
                        <input
                          type="number"
                          min="1"
                          value={quizSettings.maxRetakes || 1}
                          onChange={(e) => setQuizSettings({ ...quizSettings, maxRetakes: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                        />
                      </div>
                    </div>
                  )}

                  {/* Passing Score */}
                  <div className="bg-gray-50 rounded-xl p-5">
                    <div>
                      <h3 className="text-sm font-semibold text-black">Passing Score (%)</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Minimum percentage required to pass the quiz
                      </p>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={quizSettings.passingScore || 60}
                        onChange={(e) => setQuizSettings({ ...quizSettings, passingScore: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) })}
                        className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                      />
                    </div>
                  </div>

                  {/* Shuffle Questions */}
                  <div className="bg-gray-50 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-black">Shuffle Questions</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Randomize question order for each student
                        </p>
                      </div>
                      <button
                        onClick={() => setQuizSettings({ ...quizSettings, shuffleQuestions: !quizSettings.shuffleQuestions })}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          quizSettings.shuffleQuestions ? "bg-black" : "bg-gray-300"
                        }`}
                      >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          quizSettings.shuffleQuestions ? "translate-x-6" : "translate-x-0"
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Helper Text */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-xs text-blue-800">
                      Retakes are for practice only. Leaderboard rankings are based solely on the first valid attempt.
                    </p>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={saveQuizSettings}
                    disabled={savingSettings}
                    className="w-full py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-900 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {savingSettings && <Loader2 size={15} className="animate-spin" />}
                    Save Settings
                  </button>
                </div>
              ) : null}
            </SheetContent>
          </Sheet>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={!!deleteQuizId}
        title="Delete Quiz"
        description="Are you sure you want to delete this quiz? All questions and results will be permanently removed. This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteQuizId(null)}
        isLoading={isDeleting}
      />

      {/* Publish / Unpublish confirmation */}
      <ConfirmModal
        isOpen={!!publishConfirm}
        title={publishConfirm?.isPublished ? "Unpublish Quiz?" : "Publish Quiz?"}
        description={
          publishConfirm?.isPublished
            ? "This will hide the quiz from students. It can be re-published at any time."
            : "This will make the quiz visible to students immediately (subject to start/end dates)."
        }
        confirmText={publishConfirm?.isPublished ? "Unpublish" : "Publish"}
        onConfirm={handleTogglePublish}
        onCancel={() => setPublishConfirm(null)}
        isLoading={isPublishing}
      />
    </AdminLayout>
  );
}
