import { useState, useEffect } from "react";
import { AdminLayout } from "./admin-sidebar";
import {
  apiAdminGetQuizzes,
  apiAdminGetQuestions,
  apiAdminCreateQuestion,
  apiAdminUpdateQuestion,
  apiAdminDeleteQuestion,
  getErrorMessage,
  Quiz,
  Question,
} from "./api";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Edit2, Trash2, X, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router";

type QuestionOption = "A" | "B" | "C" | "D";
type QuestionOptionField = "optionA" | "optionB" | "optionC" | "optionD";

interface QuestionModalProps {
  quizId: string;
  question?: Question;
  onClose: () => void;
  onRefresh: () => void;
}

function QuestionModal({ quizId, question, onClose, onRefresh }: QuestionModalProps) {
  const [form, setForm] = useState({
    questionText: question?.questionText ?? "",
    optionA: question?.optionA ?? "",
    optionB: question?.optionB ?? "",
    optionC: question?.optionC ?? "",
    optionD: question?.optionD ?? "",
    correctOption: (question?.correctOption ?? "A") as QuestionOption,
    marks: question?.marks ?? 3,
    negativeMarks: question?.negativeMarks ?? 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      questionText: form.questionText,
      optionA: form.optionA,
      optionB: form.optionB,
      optionC: form.optionC,
      optionD: form.optionD,
      correctOption: form.correctOption,
      marks: Number(form.marks),
      negativeMarks: Number(form.negativeMarks),
    };

    try {
      if (question) {
        await apiAdminUpdateQuestion(question.id, payload);
      } else {
        await apiAdminCreateQuestion(quizId, payload);
      }
      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to save question."));
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
          <h2 className="text-base font-bold text-black">{question ? "Edit Question" : "Add Question"}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-black">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Question Text</label>
            <textarea
              required
              value={form.questionText}
              onChange={(e) => setForm({ ...form, questionText: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black resize-none"
              rows={3}
              placeholder="Enter your question text..."
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700">Options</label>
            {([
              { key: "optionA", label: "A" },
              { key: "optionB", label: "B" },
              { key: "optionC", label: "C" },
              { key: "optionD", label: "D" },
            ] as const).map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400 w-5">{label}.</span>
                <input
                  required
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
                  placeholder={`Option ${label}`}
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Correct Answer</label>
              <select
                value={form.correctOption}
                onChange={(e) => setForm({ ...form, correctOption: e.target.value as QuestionOption })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black bg-white"
              >
                {["A", "B", "C", "D"].map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Marks</label>
              <input
                type="number"
                required
                min={0}
                value={form.marks}
                onChange={(e) => setForm({ ...form, marks: +e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Negative Marks</label>
              <input
                type="number"
                required
                min={0}
                value={form.negativeMarks}
                onChange={(e) => setForm({ ...form, negativeMarks: +e.target.value })}
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
              {question ? "Save Changes" : "Add Question"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function AdminQuestions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedQuizId = searchParams.get("quizId") || "";

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editQuestion, setEditQuestion] = useState<Question | undefined>();

  // Load quizzes list for the dropdown selector
  useEffect(() => {
    async function loadQuizzes() {
      try {
        const data = await apiAdminGetQuizzes();
        setQuizzes(data);
        if (data.length > 0 && !selectedQuizId) {
          setSearchParams({ quizId: data[0].id });
        }
      } catch (err) {
        console.error("Failed to load quizzes", err);
      } finally {
        setLoadingQuizzes(false);
      }
    }
    loadQuizzes();
  }, [selectedQuizId, setSearchParams]);

  // Load questions for the currently selected quiz
  const loadQuestions = async () => {
    if (!selectedQuizId) return;
    setLoadingQuestions(true);
    try {
      const data = await apiAdminGetQuestions(selectedQuizId);
      setQuestions(data);
    } catch (err) {
      console.error("Failed to load questions", err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [selectedQuizId]);

  const openCreate = () => { setEditQuestion(undefined); setShowModal(true); };
  const openEdit = (q: Question) => { setEditQuestion(q); setShowModal(true); };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      await apiAdminDeleteQuestion(id);
      loadQuestions();
    } catch (err) {
      console.error("Failed to delete question", err);
      alert("Delete failed.");
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-black">Questions Bank</h1>
          <p className="text-sm text-gray-500 mt-0.5">{questions.length} questions in this quiz</p>
        </div>
        <div className="flex gap-3 items-center">
          {/* Dropdown selector for switching quizzes */}
          {!loadingQuizzes && quizzes.length > 0 && (
            <select
              value={selectedQuizId}
              onChange={(e) => setSearchParams({ quizId: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-black"
            >
              {quizzes.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
              ))}
            </select>
          )}

          <button
            disabled={!selectedQuizId}
            onClick={openCreate}
            className="flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50"
          >
            <Plus size={15} /> Add Question
          </button>
        </div>
      </div>

      {loadingQuestions ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-black mb-2" size={24} />
          <p className="text-sm text-gray-500">Loading questions…</p>
        </div>
      ) : !selectedQuizId ? (
        <div className="bg-white border border-gray-100 rounded-xl py-16 text-center text-gray-400">
          Please select or create a quiz first to manage questions.
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl py-16 text-center text-gray-400">
          No questions added to this quiz yet. Click Add Question to add one.
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => {
            const options = [
              { key: "A", val: q.optionA },
              { key: "B", val: q.optionB },
              { key: "C", val: q.optionC },
              { key: "D", val: q.optionD },
            ];

            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white border border-gray-100 rounded-xl p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-400">Q{i + 1}</span>
                      <span className="text-xs text-gray-400">{q.marks} marks</span>
                      {q.negativeMarks > 0 && (
                        <span className="text-xs text-red-500 font-medium">-{q.negativeMarks} negative</span>
                      )}
                    </div>
                    <p className="text-sm text-black mb-3 leading-relaxed">{q.questionText}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {options.map((opt) => {
                        const isCorrect = q.correctOption === opt.key;
                        return (
                          <div
                            key={opt.key}
                            className={`text-xs px-2.5 py-1.5 rounded-lg border ${
                              isCorrect
                                ? "bg-green-50 text-green-700 border-green-200 font-medium"
                                : "bg-gray-50 text-gray-500 border-transparent"
                            }`}
                          >
                            <span className="font-bold mr-1">{opt.key}.</span>
                            {opt.val}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(q)}
                      title="Edit Question"
                      className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      title="Delete Question"
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showModal && selectedQuizId && (
          <QuestionModal
            quizId={selectedQuizId}
            question={editQuestion}
            onClose={() => setShowModal(false)}
            onRefresh={loadQuestions}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
