"use client";

import { useState } from "react";
import { AdminLayout } from "./admin-sidebar";
import { apiAdminGenerateAiQuiz, apiAdminCreateQuiz, apiAdminCreateQuestion, apiAdminGenerateAiImage } from "./api";
import { Loader2, Plus, Trash2, Save, RefreshCw, Sparkles, ChevronRight, Edit3, Image, Upload, Trash2 as Remove, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";

type WorkflowStep = "configure" | "preview" | "save";

interface GeneratedQuestion {
  question: string;
  imageUrl?: string;
  options: string[];
  correctAnswer: string;
  marks?: number;
}

interface GeneratedQuiz {
  title: string;
  description: string;
  questions: GeneratedQuestion[];
}

export function AdminAiQuizGenerator() {
  const router = useRouter();

  // ── Step 1: Configure ────────────────────────────────────────────────────
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("Programming");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [totalMarks, setTotalMarks] = useState<number>(10);
  const [negativeMarks, setNegativeMarks] = useState<number>(0);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().slice(0, 10); });
  const [durationInMinutes, setDurationInMinutes] = useState<number>(30);
  const [visibility, setVisibility] = useState<"public" | "private">("private");

  const [step, setStep] = useState<WorkflowStep>("configure");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuiz | null>(null);
  const [saving, setSaving] = useState(false);
  // Image generation state (per question modal)
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState("");
  const [generatingImage, setGeneratingImage] = useState(false);

  // ── Total Marks Calculation ───────────────────────────────────────────────────
  const calculatePerQuestionMarks = () => {
    if (generatedQuiz && generatedQuiz.questions.length > 0) {
      return Number((totalMarks / generatedQuiz.questions.length).toFixed(1));
    }
    return 1; // Default 1 mark
  };

  // ── Step 1 → Generate ───────────────────────────────────────────────────────
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    if (questionCount < 1) { setError("Number of questions must be at least 1."); return; }

    setLoading(true);
    setError("");
    setGeneratedQuiz(null);

    try {
      const quiz = await apiAdminGenerateAiQuiz({ topic, category, difficulty, questionCount });
      if (quiz.error) throw new Error(quiz.error);

      // Strict validation against AI output hallucination
      if (!quiz.questions || quiz.questions.length !== questionCount) {
        throw new Error(`AI generated ${quiz.questions?.length || 0} questions, but requested ${questionCount}. Please regenerate.`);
      }

      for (let i = 0; i < quiz.questions.length; i++) {
        const q = quiz.questions[i];
        if (!q.options || q.options.length !== 4) {
          throw new Error(`AI generated ${q.options?.length || 0} options for question ${i + 1}. Expected exactly 4. Please regenerate.`);
        }
        if (!q.correctAnswer || !q.options.includes(q.correctAnswer)) {
          throw new Error(`AI generated an invalid correct answer for question ${i + 1}. The correct answer string must exactly match one of the 4 options. Please regenerate.`);
        }
      }

      // Clean up: remove any marks from AI output
      const cleaned: GeneratedQuiz = {
        ...quiz,
        questions: quiz.questions.map((q: any) => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
        })),
      };
      setGeneratedQuiz(cleaned);
      setStep("preview");
    } catch (err: any) {
      setError(err.message || "Failed to generate quiz. AI might have returned invalid format.");
    } finally {
      setLoading(false);
    }
  };

  // ── Regenerate ───────────────────────────────────────────────────────────────
  const handleRegenerate = () => {
    setGeneratedQuiz(null);
    setStep("configure");
    setError("");
  };

  // ── Save to DB ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!generatedQuiz) return;
    setSaving(true);
    setError("");

    const perQuestionMarks = calculatePerQuestionMarks();
    const calculatedTotalMarks = perQuestionMarks * generatedQuiz.questions.length;

    try {
      const newQuiz = await apiAdminCreateQuiz({
        title: generatedQuiz.title,
        description: generatedQuiz.description,
        instructions: "AI Generated Quiz",
        startDate: new Date(`${startDate}T00:00:00.000Z`).toISOString(),
        endDate: new Date(`${endDate}T23:59:59.000Z`).toISOString(),
        durationInMinutes,
        totalMarks: parseFloat(calculatedTotalMarks.toFixed(2)),
        questionCount: generatedQuiz.questions.length,
        negativeMarks,
        visibility,
      });

      for (let i = 0; i < generatedQuiz.questions.length; i++) {
        const q = generatedQuiz.questions[i];
        const correctOptIndex = q.options.indexOf(q.correctAnswer);
        
        if (correctOptIndex === -1) {
          throw new Error(`Q${i + 1}: The correct answer must exactly match one of the 4 options. Please fix the text.`);
        }
        
        const correctOptionLabel = (["A", "B", "C", "D"] as const)[correctOptIndex];

        await apiAdminCreateQuestion(newQuiz.id, {
          text: q.question,
          imageUrl: q.imageUrl || undefined,
          optionA: q.options[0] || "",
          optionB: q.options[1] || "",
          optionC: q.options[2] || "",
          optionD: q.options[3] || "",
          correctOption: correctOptionLabel,
          marks: parseFloat(perQuestionMarks.toFixed(2)),
        });
      }

      router.push("/admin/quizzes");
    } catch (err: any) {
      setError(err.message || "Failed to save quiz");
      setSaving(false);
    }
  };

  // ── Update a question field ───────────────────────────────────────────────────
  const updateQuestion = (i: number, update: Partial<GeneratedQuestion>) => {
    if (!generatedQuiz) return;
    const newQs = [...generatedQuiz.questions];
    newQs[i] = { ...newQs[i], ...update };
    setGeneratedQuiz({ ...generatedQuiz, questions: newQs });
  };

  const updateOption = (qi: number, oi: number, value: string) => {
    if (!generatedQuiz) return;
    const newQs = [...generatedQuiz.questions];
    const opts = [...newQs[qi].options];
    opts[oi] = value;
    newQs[qi] = { ...newQs[qi], options: opts };
    setGeneratedQuiz({ ...generatedQuiz, questions: newQs });
  };

  const addQuestion = () => {
    if (!generatedQuiz) return;
    setGeneratedQuiz({
      ...generatedQuiz,
      questions: [
        ...generatedQuiz.questions,
        { question: "", imageUrl: "", options: ["", "", "", ""], correctAnswer: "" },
      ],
    });
  };

  const [generatingImageIndex, setGeneratingImageIndex] = useState<number | null>(null);

  const handleGenerateImage = async (index: number, questionText: string) => {
    if (!questionText.trim()) return;

    setGeneratingImageIndex(index);
    try {
      const result = await apiAdminGenerateAiImage(
        `A clear, educational diagram or illustration for this quiz question: "${questionText}". Simple, professional style, suitable for an online quiz.`
      );
      if (!generatedQuiz) return;

      const newQuestions = [...generatedQuiz.questions];
      newQuestions[index] = { ...newQuestions[index], imageUrl: result.imageUrl };
      setGeneratedQuiz({ ...generatedQuiz, questions: newQuestions });
    } catch (err) {
      console.error("Failed to generate image", err);
    } finally {
      setGeneratingImageIndex(null);
    }
  };

  // File and image management
  const fileInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const handleFileUpload = (index: number, file: File) => {
    if (!generatedQuiz) return;
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert("Only PNG, JPG, JPEG, and WEBP files are allowed.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const newQs = [...generatedQuiz.questions];
      newQs[index] = { ...newQs[index], imageUrl: dataUrl };
      setGeneratedQuiz({ ...generatedQuiz, questions: newQs });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && generatedQuiz) {
      handleFileUpload(index, e.dataTransfer.files[0]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent, index: number) => {
    if (e.clipboardData && e.clipboardData.files.length > 0 && generatedQuiz) {
      e.preventDefault();
      handleFileUpload(index, e.clipboardData.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (e.target.files && e.target.files.length > 0 && generatedQuiz) {
      handleFileUpload(index, e.target.files[0]);
    }
  };

  // Modal image generation functions
  const openGenerateModal = (index: number) => {
    if (!generatedQuiz) return;
    setActiveQuestionIndex(index);
    setGeneratePrompt(generatedQuiz.questions[index].question ? `A clear, educational diagram or illustration for this quiz question: "${generatedQuiz.questions[index].question}". Simple, professional style, suitable for an online quiz.` : "");
    setGeneratedImageUrl(null);
    setGenerateError("");
    setShowGenerateModal(true);
  };

  const handleGenerateImageModal = async (prompt = generatePrompt) => {
    if (!prompt.trim()) {
      setGenerateError("Please enter a prompt");
      return;
    }

    setGeneratingImage(true);
    setGenerateError("");
    try {
      const result = await apiAdminGenerateAiImage(prompt);
      setGeneratedImageUrl(result.imageUrl);
    } catch (err) {
      console.error("Failed to generate image", err);
      setGenerateError("Failed to generate image. Please try again.");
    } finally {
      setGeneratingImage(false);
    }
  };

  const useGeneratedImage = () => {
    if (activeQuestionIndex !== null && generatedQuiz && generatedImageUrl) {
      const newQs = [...generatedQuiz.questions];
      newQs[activeQuestionIndex] = { ...newQs[activeQuestionIndex], imageUrl: generatedImageUrl };
      setGeneratedQuiz({ ...generatedQuiz, questions: newQs });
    }
    setShowGenerateModal(false);
    setActiveQuestionIndex(null);
    setGeneratedImageUrl(null);
    setGenerateError("");
  };

  const removeQuestion = (i: number) => {
    if (!generatedQuiz) return;
    setGeneratedQuiz({
      ...generatedQuiz,
      questions: generatedQuiz.questions.filter((_, idx) => idx !== i),
    });
  };

  // ── Total marks summary ──────────────────────────────────────────────────────
  const perQuestionMarks = generatedQuiz ? calculatePerQuestionMarks() : 0;
  const computedTotalMarks = generatedQuiz
    ? (perQuestionMarks * generatedQuiz.questions.length).toFixed(2)
    : "0.00";

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      {/* Header with breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <button onClick={() => router.push("/admin/quizzes")} className="hover:text-black">Quizzes</button>
          <ChevronRight size={12} />
          <span className="text-black font-medium">AI Quiz Generator</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-purple-500" />
          <h1 className="text-xl font-bold text-black">AI Quiz Generator</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">Generate quizzes instantly using Groq AI, then preview and edit before saving.</p>

        {/* Workflow steps indicator */}
        <div className="flex items-center gap-2 mt-3">
          {(["configure", "preview", "save"] as WorkflowStep[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                step === s
                  ? "bg-black text-white border-black"
                  : i < ["configure", "preview", "save"].indexOf(step)
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-gray-50 text-gray-400 border-gray-200"
              }`}>
                <span>{i + 1}</span>
                <span className="capitalize">{s === "configure" ? "Configure" : s === "preview" ? "Preview & Edit" : "Save"}</span>
              </div>
              {i < 2 && <ChevronRight size={12} className="text-gray-300" />}
            </div>
          ))}
        </div>
      </div>

      {/* ── Step 1: Configure ─────────────────────────────────────────────────── */}
      {step === "configure" && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm max-w-2xl">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Topic <span className="text-red-500">*</span></label>
                <span className="text-[10px] text-gray-400">{topic.length}/100</span>
              </div>
              <input
                required
                maxLength={100}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Next.js Routing, World War 2, Python Data Types"
                className="w-full px-3 py-2.5 border rounded-lg focus:border-black outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                <input
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-lg focus:border-black outline-none"
                  placeholder="e.g. Programming, Science"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty <span className="text-red-500">*</span></label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-lg focus:border-black outline-none"
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Questions <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Math.floor(Number(e.target.value)))}
                  className="w-full px-3 py-2.5 border rounded-lg focus:border-black outline-none"
                  placeholder="e.g. 10"
                />
                <p className="text-[10px] text-gray-400 mt-1">Any positive integer (10, 20, 50…)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Marks <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border rounded-lg focus:border-black outline-none"
                  placeholder="e.g. 10, 20, 50"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Marks per question = {totalMarks} ÷ {questionCount} = {Number((totalMarks / questionCount).toFixed(1))}
                </p>
              </div>
            </div>

            {/* Negative Marks field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Negative Marks Per Wrong Answer
                <span className="ml-1 text-gray-400 font-normal text-xs">(Optional)</span>
              </label>
              <input
                id="ai-quiz-negative-marks"
                type="number"
                min={0}
                max={99.99}
                step={0.01}
                value={negativeMarks}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setNegativeMarks(isNaN(v) ? 0 : Math.max(0, parseFloat(v.toFixed(2))));
                }}
                className="w-full px-3 py-2.5 border rounded-lg focus:border-black outline-none"
                placeholder="e.g. 0.25"
                aria-label="Negative marks deducted per wrong answer"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Marks deducted for each incorrect answer. Use 0 to disable negative marking.
              </p>
            </div>

            {/* Date & Duration row */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-lg focus:border-black outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-lg focus:border-black outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (min) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={durationInMinutes}
                  onChange={(e) => setDurationInMinutes(Math.floor(Number(e.target.value)))}
                  className="w-full px-3 py-2.5 border rounded-lg focus:border-black outline-none"
                  placeholder="e.g. 30"
                />
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quiz Visibility <span className="text-red-500">*</span>
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as "public" | "private")}
                className="w-full px-3 py-2.5 border rounded-lg focus:border-black outline-none"
              >
                <option value="private">Private (No leaderboard)</option>
                <option value="public">Public (Show leaderboard)</option>
              </select>
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 p-2.5 rounded-lg border border-red-100">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-black text-white rounded-lg flex justify-center items-center gap-2 hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="animate-spin" size={16} />}
              <Sparkles size={16} />
              {loading ? "Generating Quiz…" : "Generate Quiz"}
            </button>
          </form>
        </div>
      )}

      {/* ── Step 2: Preview & Edit ─────────────────────────────────────────────── */}
      {step === "preview" && generatedQuiz && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          {/* Action bar */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <Edit3 size={16} className="text-gray-500" />
                Preview & Edit
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {generatedQuiz.questions.length} questions · {computedTotalMarks} total marks
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRegenerate}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw size={14} /> Regenerate
              </button>
              <button
                onClick={() => setStep("save")}
                disabled={saving || generatedQuiz.questions.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-900 disabled:opacity-50"
              >
                <Save size={14} /> Proceed to Save
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 p-2.5 rounded-lg border border-red-100 mb-4">{error}</p>}

          {/* Quiz metadata */}
          <div className="space-y-3 mb-6 pb-6 border-b border-gray-100">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs font-medium text-gray-700">Quiz Title <span className="text-red-500">*</span></label>
                <span className="text-[10px] text-gray-400">{generatedQuiz.title.length}/100</span>
              </div>
              <input
                required
                maxLength={100}
                value={generatedQuiz.title}
                onChange={(e) => setGeneratedQuiz({ ...generatedQuiz, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm font-semibold outline-none focus:border-black"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs font-medium text-gray-700">Description <span className="text-red-500">*</span></label>
                <span className="text-[10px] text-gray-400">{generatedQuiz.description.length}/500</span>
              </div>
              <textarea
                required
                maxLength={500}
                value={generatedQuiz.description}
                onChange={(e) => setGeneratedQuiz({ ...generatedQuiz, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm h-16 resize-none outline-none focus:border-black"
              />
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Questions ({generatedQuiz.questions.length})</h3>
              <button
                onClick={addQuestion}
                className="flex items-center gap-1 text-sm bg-gray-100 px-3 py-1.5 rounded hover:bg-gray-200"
              >
                <Plus size={14} /> Add Question
              </button>
            </div>

            {generatedQuiz.questions.map((q, i) => (
          <div key={i} className="border border-gray-100 p-4 rounded-xl relative bg-gray-50/40" onPaste={(e) => handlePaste(e, i)}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Q{i + 1}</span>
              <button
                onClick={() => removeQuestion(i)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>

            {/* Question text */}
            <label className="block text-xs font-medium mb-1 text-gray-600">Question Text <span className="text-red-500">*</span></label>
            <input
              required
              value={q.question}
              onChange={(e) => updateQuestion(i, { question: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mb-3 text-sm outline-none focus:border-black"
            />

            {/* Image Section */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-gray-700">Question Image (Optional)</label>
                <button
                  type="button"
                  onClick={() => openGenerateModal(i)}
                  className="flex items-center gap-1 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded-lg"
                >
                  <Image size={12} />
                  Generate Image
                </button>
              </div>

              {!q.imageUrl ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => handleDrop(e, i)}
                  onClick={() => fileInputRefs.current[i]?.click()}
                  className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all hover:border-purple-400 bg-gray-50"
                >
                  <input
                    ref={(el) => fileInputRefs.current[i] = el}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => handleFileInputChange(e, i)}
                    className="hidden"
                  />
                  <Upload size={28} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Drag and drop or click to upload
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports PNG, JPG, JPEG, WEBP • Paste image from clipboard
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl p-3">
                  <img
                    src={q.imageUrl}
                    alt="Question preview"
                    className="max-h-48 max-w-full object-contain mx-auto rounded-lg mb-3"
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[i]?.click()}
                      className="flex-1 text-sm font-medium text-purple-600 hover:text-purple-700 border border-purple-200 rounded-lg px-3 py-2"
                    >
                      Replace Image
                    </button>
                    <button
                      type="button"
                      onClick={() => updateQuestion(i, { imageUrl: "" })}
                      className="flex-1 text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 rounded-lg px-3 py-2 flex items-center justify-center gap-1"
                    >
                      <Remove size={14} /> Remove
                    </button>
                  </div>
                </div>
              )}

              {/* Image URL Input as alternative */}
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1">Or paste image URL:</p>
                <input
                  type="url"
                  value={q.imageUrl || ""}
                  onChange={(e) => updateQuestion(i, { imageUrl: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-black"
                  placeholder="https://example.com/image.png"
                />
              </div>
            </div>

                {/* Options */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {q.options.map((opt, oi) => (
                    <div key={oi}>
                      <label className="block text-xs font-medium mb-0.5 text-gray-500">
                        Option {["A", "B", "C", "D"][oi]} <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        value={opt}
                        onChange={(e) => updateOption(i, oi, e.target.value)}
                        className="w-full px-2 py-1.5 border rounded-md text-sm outline-none focus:border-black"
                      />
                    </div>
                  ))}
                </div>

                {/* Correct answer */}
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-0.5 text-green-600">Correct Answer <span className="text-red-500">*</span></label>
                  <select
                    value={q.correctAnswer}
                    onChange={(e) => updateQuestion(i, { correctAnswer: e.target.value })}
                    className="w-full px-2 py-1.5 border border-green-200 rounded-md text-sm outline-none focus:border-green-400"
                  >
                    {q.options.map((opt, oi) => (
                      <option key={oi} value={opt}>{opt || `Option ${oi + 1}`}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 3: Save ─────────────────────────────────────────────────────── */}
      {step === "save" && generatedQuiz && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm max-w-lg">
          <h2 className="text-base font-bold mb-2">Save Quiz</h2>
          <p className="text-sm text-gray-500 mb-4">Review the summary below, then save to add this quiz to the platform.</p>

          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Title</span><span className="font-medium text-right max-w-[60%] truncate">{generatedQuiz.title}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Questions</span><span className="font-medium">{generatedQuiz.questions.length}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Total Marks</span><span className="font-medium">{computedTotalMarks}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Negative Marks</span><span className="font-medium">{negativeMarks === 0 ? "None" : `-${negativeMarks} per wrong answer`}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Start Date</span><span className="font-medium">{startDate}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">End Date</span><span className="font-medium">{endDate}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Duration</span><span className="font-medium">{durationInMinutes} min</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Category</span><span className="font-medium">{category}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Difficulty</span><span className="font-medium">{difficulty}</span></div>
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 p-2.5 rounded-lg border border-red-100 mb-4">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={() => setStep("preview")}
              disabled={saving}
              className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Back to Edit
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 bg-black text-white rounded-lg flex items-center justify-center gap-1.5 text-sm font-medium hover:bg-gray-900 disabled:opacity-50"
            >
              {saving && <Loader2 className="animate-spin" size={14} />}
              <Save size={14} />
              {saving ? "Saving…" : "Save & Publish"}
            </button>
          </div>
        </div>
      )}

      {/* Generate Image Modal */}
      <AnimatePresence>
        {showGenerateModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4 overflow-y-auto py-8">
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-black">Generate Image</h2>
                <button onClick={() => { setShowGenerateModal(false); setActiveQuestionIndex(null); setGeneratedImageUrl(null); }} className="p-1 text-gray-400 hover:text-black">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Image Prompt</label>
                  <textarea
                    value={generatePrompt}
                    onChange={(e) => setGeneratePrompt(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-black resize-none"
                    rows={4}
                    placeholder="Example: Human digestive system labeled educational diagram"
                  />
                </div>

                {generateError && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    {generateError}
                  </div>
                )}

                {generatedImageUrl && (
                  <div className="border border-gray-200 rounded-xl p-3">
                    <img
                      src={generatedImageUrl}
                      alt="Generated preview"
                      className="max-h-64 max-w-full object-contain mx-auto rounded-lg"
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  {!generatedImageUrl ? (
                    <button
                      type="button"
                      onClick={() => handleGenerateImageModal()}
                      disabled={generatingImage}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-purple-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                    >
                      {generatingImage && <Loader2 size={14} className="animate-spin" />}
                      {generatingImage ? "Generating image…" : "Generate"}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleGenerateImageModal()}
                        disabled={generatingImage}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-purple-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                      >
                        {generatingImage && <Loader2 size={14} className="animate-spin" />}
                        {generatingImage ? "Regenerating…" : "Regenerate"}
                      </button>
                      <button
                        type="button"
                        onClick={useGeneratedImage}
                        className="flex-1 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-900"
                      >
                        Use Image
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => { setShowGenerateModal(false); setActiveQuestionIndex(null); setGeneratedImageUrl(null); }}
                    className="py-2.5 px-4 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
