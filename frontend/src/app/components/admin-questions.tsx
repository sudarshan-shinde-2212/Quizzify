"use client";

import { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "./admin-sidebar";
import {
  apiAdminGetQuizzes,
  apiAdminGetQuestions,
  apiAdminCreateQuestion,
  apiAdminUpdateQuestion,
  apiAdminDeleteQuestion,
  apiAdminSearchQuestions,
  apiAdminGenerateAiImage,
  getErrorMessage,
  Quiz,
  Question,
} from "./api";
import { ConfirmModal } from "./ui/confirm-modal";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Edit2, Trash2, X, Loader2, Search, Image } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebounce } from "./use-debounce";

type QuestionOption = "A" | "B" | "C" | "D";
type QuestionOptionField = "optionA" | "optionB" | "optionC" | "optionD";

interface QuestionModalProps {
  quizId: string;
  question?: Question;
  selectedQuiz?: Quiz | null;
  onClose: () => void;
  onRefresh: () => void;
}

function QuestionModal({ quizId, question, selectedQuiz, onClose, onRefresh }: QuestionModalProps) {
  // Use quiz values for marks and negative marks automatically
  const marks = question?.marks ?? 
    (selectedQuiz && selectedQuiz.questionCount > 0 
      ? Number((selectedQuiz.totalMarks / selectedQuiz.questionCount).toFixed(1)) 
      : 3);
      
  const negativeMarks = question?.negativeMarks ?? 
    (selectedQuiz ? selectedQuiz.negativeMarks : 0);

  const [form, setForm] = useState({
    text: question?.text ?? "",
    imageUrl: question?.imageUrl ?? "",
    optionA: question?.optionA ?? "",
    optionB: question?.optionB ?? "",
    optionC: question?.optionC ?? "",
    optionD: question?.optionD ?? "",
    correctOption: (question?.correctOption ?? "A") as QuestionOption,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatingImage, setGeneratingImage] = useState(false);

  const handleGenerateImage = async () => {
    if (!form.text.trim()) return;

    setGeneratingImage(true);
    try {
      const result = await apiAdminGenerateAiImage(
        `A clear, educational diagram or illustration for this quiz question: "${form.text}". Simple, professional style, suitable for an online quiz.`
      );
      setForm({ ...form, imageUrl: result.imageUrl });
    } catch (err) {
      console.error("Failed to generate image", err);
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      text: form.text,
      imageUrl: form.imageUrl || undefined,
      optionA: form.optionA,
      optionB: form.optionB,
      optionC: form.optionC,
      optionD: form.optionD,
      correctOption: form.correctOption,
      marks: Number(marks),
      negativeMarks: Number(negativeMarks),
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
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-black">{question ? "Edit Question" : "Add Question"}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-black">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-gray-700">Question Text <span className="text-red-500">*</span></label>
              <span className="text-[10px] text-gray-400">{form.text.length}/500</span>
            </div>
            <textarea
              required
              maxLength={500}
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-black resize-none"
              rows={3}
              placeholder="Enter your question text..."
            />
          </div>

          {/* Image URL Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-gray-700">Image URL (Optional)</label>
              <button
                type="button"
                onClick={handleGenerateImage}
                disabled={generatingImage || !form.text.trim()}
                className="flex items-center gap-1 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-2 py-1 rounded-lg"
              >
                {generatingImage ? <Loader2 size={12} className="animate-spin" /> : <Image size={12} />}
                Generate Image
              </button>
            </div>
            <input
              type="url"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-black"
              placeholder="Enter image URL or generate one"
            />
            {/* Preview */}
            {form.imageUrl && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Preview:</p>
                <img
                  src={form.imageUrl}
                  alt="Question preview"
                  className="max-h-40 max-w-full object-contain border border-gray-200 rounded-lg"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700">Options <span className="text-red-500">*</span></label>
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
                  maxLength={200}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
                  placeholder={`Option ${label}`}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Correct Answer <span className="text-red-500">*</span></label>
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
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-600">
              Marks: <span className="font-bold">{marks}</span> | Negative Marks: <span className="font-bold">{negativeMarks}</span>
            </p>
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedQuizId = searchParams?.get("quizId") || "";

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editQuestion, setEditQuestion] = useState<Question | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Question[]>([]);
  const [searching, setSearching] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Load quizzes list for the dropdown selector
  useEffect(() => {
    async function loadQuizzes() {
      try {
        const data = await apiAdminGetQuizzes();
        setQuizzes(data);
        if (data.length > 0 && !selectedQuizId) {
          const params = new URLSearchParams(searchParams?.toString() || "");
          params.set("quizId", data[0].id);
          router.push(`${pathname}?${params.toString()}`);
        }
      } catch (err) {
        console.error("Failed to load quizzes", err);
      } finally {
        setLoadingQuizzes(false);
      }
    }
    loadQuizzes();
  }, [selectedQuizId, searchParams, router, pathname]);

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

  // Handle global search across all questions
  useEffect(() => {
    if (!debouncedSearch) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    async function performSearch() {
      setSearching(true);
      try {
        const results = await apiAdminSearchQuestions(debouncedSearch);
        setSearchResults(results);
      } catch (err) {
        console.error("Failed to search questions", err);
      } finally {
        setSearching(false);
      }
    }

    performSearch();
  }, [debouncedSearch]);

  const openCreate = () => { setEditQuestion(undefined); setShowModal(true); };
  const openEdit = (q: Question) => { setEditQuestion(q); setShowModal(true); };

  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteQuestionId) return;
    setIsDeleting(true);
    try {
      await apiAdminDeleteQuestion(deleteQuestionId);
      loadQuestions();
      // Re-run search if active
      if (debouncedSearch) {
        const results = await apiAdminSearchQuestions(debouncedSearch);
        setSearchResults(results);
      }
    } catch (err) {
      console.error("Failed to delete question", err);
      alert("Delete failed.");
    } finally {
      setIsDeleting(false);
      setDeleteQuestionId(null);
    }
  };

  // Derive selected quiz details for limits
  const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId);
  const questionLimit = selectedQuiz?.questionCount ?? 0;
  const assignedMarks = questions.reduce((sum, q) => sum + Number(q.marks), 0);
  const targetMarks = selectedQuiz ? Number(selectedQuiz.totalMarks) : 0;
  const atQuestionLimit = questionLimit > 0 && questions.length >= questionLimit;
  const marksMatch = assignedMarks === targetMarks;

  const displayQuestions = debouncedSearch ? searchResults : questions;

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-black">Questions Bank</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {displayQuestions.length}{questionLimit > 0 && !debouncedSearch ? ` / ${questionLimit}` : ""} questions
            {selectedQuiz && !debouncedSearch && (
              <span className={`ml-2 font-medium ${marksMatch ? "text-green-600" : "text-amber-600"}`}>
                (Assigned: {assignedMarks} / {targetMarks} Marks)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          {/* Dropdown selector for switching quizzes */}
          {!loadingQuizzes && quizzes.length > 0 && (
            <select
              value={selectedQuizId}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams?.toString() || "");
                params.set("quizId", e.target.value);
                router.push(`${pathname}?${params.toString()}`);
              }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-black"
            >
              {quizzes.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
              ))}
            </select>
          )}

          <button
            disabled={!selectedQuizId || atQuestionLimit || !!debouncedSearch}
            onClick={openCreate}
            title={atQuestionLimit ? `Limit reached: ${questionLimit} questions max` : "Add a new question"}
            className="flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={15} /> Add Question
          </button>
        </div>
      </div>

      {/* Local Search (for questions page only) */}
      <div className="relative mb-6">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search all questions by text, quiz name, or difficulty..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 text-black placeholder-gray-500 bg-white border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-all"
        />
        {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 animate-spin" size={20} />}
      </div>

      {/* Question limit / marks warning banners */}
      {selectedQuiz && atQuestionLimit && !debouncedSearch && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-amber-800">
          <span className="font-semibold">Question limit reached.</span>
          <span>This quiz allows exactly {questionLimit} question{questionLimit !== 1 ? "s" : ""}. Remove one before adding another.</span>
        </div>
      )}
      {/* Warning if marks don't perfectly match the total. Only show when limit reached, or if they've overshot early */}
      {selectedQuiz && questions.length > 0 && !debouncedSearch && (!marksMatch && (questions.length === questionLimit || assignedMarks > targetMarks)) && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-red-800">
          <span className="font-semibold">Marks mismatch.</span>
          <span>Assigned marks ({assignedMarks}) do not equal quiz total ({targetMarks}). Fix before publishing.</span>
        </div>
      )}
      {selectedQuiz && questions.length > 0 && questions.length < questionLimit && !atQuestionLimit && assignedMarks <= targetMarks && !debouncedSearch && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-blue-800">
          <span className="font-semibold">Add more questions.</span>
          <span>Please add all {questionLimit} questions before publishing. ({questions.length} of {questionLimit} added)</span>
        </div>
      )}

      {loadingQuestions || searching ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-black mb-2" size={24} />
          <p className="text-sm text-gray-500">{searching ? "Searching questions…" : "Loading questions…"}</p>
        </div>
      ) : !selectedQuizId && !debouncedSearch ? (
        <div className="bg-white border border-gray-100 rounded-xl py-16 text-center text-gray-400">
          Please select or create a quiz first to manage questions.
        </div>
      ) : displayQuestions.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl py-16 text-center text-gray-400">
          {debouncedSearch ? "No questions found matching your search." : "No questions added to this quiz yet. Click Add Question to add one."}
        </div>
      ) : (
        <div className="space-y-3">
          {displayQuestions.map((q, i) => {
            const options = [
              { key: "A", val: q.optionA },
              { key: "B", val: q.optionB },
              { key: "C", val: q.optionC },
              { key: "D", val: q.optionD },
            ];
            const quizForQuestion = quizzes.find(quiz => quiz.id === q.quizId);

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
                      {debouncedSearch && quizForQuestion && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{quizForQuestion.title}</span>
                      )}
                      <span className="text-xs text-gray-400">{q.marks} marks</span>
                      {q.negativeMarks && q.negativeMarks > 0 && (
                        <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full">-{q.negativeMarks} neg</span>
                      )}
                      {q.difficulty && (
                        <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full">{q.difficulty}</span>
                      )}
                    </div>
                    <p className="text-sm text-black mb-3 leading-relaxed">{q.text}</p>
                    {/* Image Preview */}
                    {q.imageUrl && (
                      <div className="mb-3">
                        <img
                          src={q.imageUrl}
                          alt={`Question ${i + 1}`}
                          className="max-h-32 max-w-full object-contain border border-gray-200 rounded-lg"
                        />
                      </div>
                    )}
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
                      onClick={() => setDeleteQuestionId(q.id)}
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
            selectedQuiz={selectedQuiz}
            onClose={() => setShowModal(false)}
            onRefresh={loadQuestions}
          />
        )}
      </AnimatePresence>
      <ConfirmModal
        isOpen={!!deleteQuestionId}
        title="Delete Question"
        description="Are you sure you want to delete this question? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteQuestionId(null)}
        isLoading={isDeleting}
        loadingText="Deleting..."
        variant="danger"
      />
    </AdminLayout>
  );
}
