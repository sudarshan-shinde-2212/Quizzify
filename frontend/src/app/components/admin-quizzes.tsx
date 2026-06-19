"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "./admin-sidebar";
import {
  apiAdminGetQuizzes,
  apiAdminCreateQuiz,
  apiAdminUpdateQuiz,
  apiAdminDeleteQuiz,
  apiAdminPublishQuiz,
  getErrorMessage,
  Quiz,
} from "./api";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Plus, Edit2, Trash2, Eye, Clock, Trophy, X, Loader2, Play, PowerOff } from "lucide-react";
import { useRouter } from "next/navigation";

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

function QuizFormModal({ quiz, onClose, onRefresh }: QuizFormModalProps) {
  const [form, setForm] = useState({
    title: quiz?.title ?? "",
    description: quiz?.description ?? "",
    instructions: quiz?.instructions ?? "",
    duration: quiz?.durationInMinutes ?? 30,
    totalMarks: quiz?.totalMarks ?? 30,
    startDate: toDateInputValue(quiz?.startDate),
    endDate: toDateInputValue(quiz?.endDate),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const durationInMinutes = Number(form.duration);
    const totalMarks = Number(form.totalMarks);
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

    if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
      setError("Please choose valid start and end dates.");
      setLoading(false);
      return;
    }

    if (startTime >= endTime) {
      setError("End date must be after start date.");
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
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-black">{quiz ? "Edit Quiz" : "Create New Quiz"}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-black">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Quiz Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black"
              placeholder="e.g. JavaScript Advanced Concepts"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black resize-none"
              rows={2}
              placeholder="Brief description of the quiz..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Instructions</label>
            <textarea
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black resize-none"
              rows={2}
              placeholder="Directions for candidate..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Duration (min)</label>
              <input
                type="number"
                required
                min={1}
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: +e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Total Marks</label>
              <input
                type="number"
                required
                min={1}
                value={form.totalMarks}
                onChange={(e) => setForm({ ...form, totalMarks: +e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Start Date</label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">End Date</label>
              <input
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black"
              />
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-6">
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
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editQuiz, setEditQuiz] = useState<Quiz | undefined>();

  const loadQuizzes = async () => {
    try {
      const data = await apiAdminGetQuizzes();
      setQuizzes(data);
    } catch (err) {
      console.error("Failed to fetch quizzes", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const openCreate = () => { setEditQuiz(undefined); setShowModal(true); };
  const openEdit = (q: Quiz) => { setEditQuiz(q); setShowModal(true); };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quiz? This cannot be undone.")) return;
    try {
      await apiAdminDeleteQuiz(id);
      loadQuizzes();
    } catch (err) {
      console.error("Failed to delete quiz", err);
      alert("Delete failed.");
    }
  };

  const handleTogglePublish = async (quiz: Quiz) => {
    try {
      await apiAdminPublishQuiz(quiz.id, !quiz.isPublished);
      loadQuizzes();
    } catch (err) {
      console.error("Failed to publish/unpublish quiz", err);
      alert("Status update failed.");
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-black">Quizzes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{quizzes.length} total quizzes</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900"
        >
          <Plus size={15} /> Create Quiz
        </button>
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
                  </div>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-1">{quiz.description}</p>
                  <div className="flex gap-4">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={11} /> {quiz.durationInMinutes}m</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Trophy size={11} /> {quiz.totalMarks} marks</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar size={11} /> {formatQuizDate(quiz.startDate)} - {formatQuizDate(quiz.endDate)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleTogglePublish(quiz)}
                    title={quiz.isPublished ? "Unpublish Quiz (set draft)" : "Publish Quiz"}
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
                    onClick={() => handleDelete(quiz.id)}
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
    </AdminLayout>
  );
}
