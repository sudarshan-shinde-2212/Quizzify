"use client";

import { useState, useRef } from "react";
import { AdminLayout } from "./admin-sidebar";
import { apiAdminGenerateAiQuiz, apiAdminCreateQuiz, apiAdminCreateQuestion, apiAdminGenerateAiImage, apiAdminUploadImage } from "./api";
import { Loader2, Plus, Trash2, Save, RefreshCw, Sparkles, ChevronRight, Edit3, Image, Upload, Trash2 as Remove, X, Video, Mic, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { QuizGeneratorForm, FileType } from "./ai/quiz-generator-form";
import { toast } from "sonner";

type WorkflowStep = "configure" | "preview" | "save";
type GeneratorType = "topic" | FileType;

export interface GeneratedQuestion {
  question: string;
  imageUrl?: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  marks?: number;
}

export interface GeneratedQuiz {
  title: string;
  description: string;
  questions: GeneratedQuestion[];
}

export function AdminAiQuizGenerator() {
  const router = useRouter();

  // ── Step 1: Configure ────────────────────────────────────────────────────
  const [generatorType, setGeneratorType] = useState<GeneratorType>("topic");
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

  // File generator state (synced from QuizGeneratorForm)
  const [fileHasFile, setFileHasFile] = useState(false);
  const [fileIsGenerating, setFileIsGenerating] = useState(false);
  
  // Image generation state (per question modal)
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState("");
  const [generatingImage, setGeneratingImage] = useState(false);

  // Single file input for question image upload
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null);

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
    if (loading) return; // Prevent duplicate requests
    if (!topic.trim()) { setError("Topic is required."); return; }
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
        if (!q.options || q.options.length < 2) {
          throw new Error(`AI generated question ${i + 1} with insufficient options. Please regenerate.`);
        }
        if (!q.correctAnswer || !q.options.includes(q.correctAnswer)) {
          throw new Error(`AI generated an invalid correct answer for question ${i + 1}. The correct answer string must exactly match one of the options. Please regenerate.`);
        }
      }

      // Clean up and set
      const cleaned: GeneratedQuiz = {
        ...quiz,
        questions: quiz.questions.map((q: any) => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        })),
      };
      setGeneratedQuiz(cleaned);
      setStep("preview");
      toast.success("Quiz generated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to generate quiz. AI might have returned invalid format.");
      toast.error("Failed to generate quiz.");
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
    if (!generatedQuiz || saving) return;
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
        category,
        difficulty,
      });

      for (let i = 0; i < generatedQuiz.questions.length; i++) {
        const q = generatedQuiz.questions[i];
        const correctOptIndex = q.options.indexOf(q.correctAnswer);
        
        if (correctOptIndex === -1) {
          throw new Error(`Q${i + 1}: The correct answer must exactly match one of the options. Please fix the text.`);
        }
        
        const correctOptionLabel = (["A", "B", "C", "D", "E", "F"] as const)[correctOptIndex];

        await apiAdminCreateQuestion(newQuiz.id, {
          text: q.question,
          imageUrl: q.imageUrl || undefined,
          optionA: q.options[0] || "",
          optionB: q.options[1] || "",
          optionC: q.options[2] || "",
          optionD: q.options[3] || "",
          correctOption: correctOptionLabel as any,
          marks: parseFloat(perQuestionMarks.toFixed(2)),
          negativeMarks: negativeMarks || undefined,
          difficulty: difficulty,
        });
      }

      toast.success("Quiz saved and published successfully!");
      setSaving(false);
      router.push("/admin/quizzes");
    } catch (err: any) {
      setError(err.message || "Failed to save quiz");
      toast.error("Failed to save quiz.");
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
    const oldOptionValue = newQs[qi].options[oi];
    const opts = [...newQs[qi].options];
    opts[oi] = value;
    
    // Sync correctAnswer if it matched the old option value
    let newCorrectAnswer = newQs[qi].correctAnswer;
    if (newQs[qi].correctAnswer === oldOptionValue) {
      newCorrectAnswer = value;
    }
    
    newQs[qi] = { ...newQs[qi], options: opts, correctAnswer: newCorrectAnswer };
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
  const [generatingAllImages, setGeneratingAllImages] = useState(false);
  const [generateAllProgress, setGenerateAllProgress] = useState<{ done: number; total: number } | null>(null);

  const handleGenerateImage = async (index: number) => {
    if (!generatedQuiz) return;
    const question = generatedQuiz.questions[index];
    if (!question.question.trim()) return;

    setGeneratingImageIndex(index);
    try {
      let prompt = `A clear, educational diagram or illustration for this quiz question: "${question.question}".`;
      if (question.options.length > 0) {
        prompt += ` Options: ${question.options.map((o, idx) => `${String.fromCharCode(65 + idx)}) ${o}`).join(', ')}.`;
      }
      prompt += ` Simple, professional style, suitable for an online quiz.`;
      
      const result = await apiAdminGenerateAiImage(prompt);
      const newQuestions = [...generatedQuiz.questions];
      newQuestions[index] = { ...newQuestions[index], imageUrl: result.imageUrl };
      setGeneratedQuiz({ ...generatedQuiz, questions: newQuestions });
      toast.success("Image generated successfully!");
    } catch (err) {
      console.error("Failed to generate image", err);
      toast.error("Failed to generate image.");
    } finally {
      setGeneratingImageIndex(null);
    }
  };

  const handleGenerateAllImages = async () => {
    if (!generatedQuiz || generatingAllImages) return;
    const questions = generatedQuiz.questions;
    const total = questions.length;
    setGeneratingAllImages(true);
    setGenerateAllProgress({ done: 0, total });

    // Work on a mutable copy so each iteration has the latest imageUrls
    let updatedQuestions = [...questions];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      // Skip questions that already have an image or have no text
      if (q.imageUrl || !q.question.trim()) {
        setGenerateAllProgress({ done: i + 1, total });
        continue;
      }
      try {
        let prompt = `A clear, educational diagram or illustration for this quiz question: "${q.question}".`;
        if (q.options.length > 0) {
          prompt += ` Options: ${q.options.map((o, idx) => `${String.fromCharCode(65 + idx)}) ${o}`).join(', ')}.`;
        }
        prompt += ` Simple, professional style, suitable for an online quiz.`;

        const result = await apiAdminGenerateAiImage(prompt);
        updatedQuestions[i] = { ...updatedQuestions[i], imageUrl: result.imageUrl };
        // Update quiz state after each image so user sees live progress
        setGeneratedQuiz(prev => prev ? { ...prev, questions: [...updatedQuestions] } : prev);
      } catch (err) {
        console.error(`Failed to generate image for Q${i + 1}`, err);
        toast.error(`Failed to generate image for Q${i + 1}. Skipping.`);
      }
      setGenerateAllProgress({ done: i + 1, total });
    }

    setGeneratingAllImages(false);
    setGenerateAllProgress(null);
    toast.success("All images generated!");
  };

  // Image Upload and Drop handlers
  const handleFileUpload = async (index: number, file: File) => {
    if (!generatedQuiz) return;
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error("Only PNG, JPG, JPEG, and WEBP files are allowed.");
      return;
    }

    setUploadingImageIndex(index);
    try {
      const result = await apiAdminUploadImage(file);
      const newQs = [...generatedQuiz.questions];
      newQs[index] = { ...newQs[index], imageUrl: result.imageUrl };
      setGeneratedQuiz({ ...generatedQuiz, questions: newQs });
      toast.success("Image uploaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image.");
    } finally {
      setUploadingImageIndex(null);
    }
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

  const triggerFileInput = (index: number) => {
    setActiveQuestionIndex(index);
    imageFileInputRef.current?.click();
  };

  // Modal image generation functions
  const openGenerateModal = (index: number) => {
    if (!generatedQuiz) return;
    const question = generatedQuiz.questions[index];
    let prompt = `A clear, educational diagram or illustration for this quiz question: "${question.question}".`;
    if (question.options.length > 0) {
      prompt += ` Options: ${question.options.map((o, idx) => `${String.fromCharCode(65 + idx)}) ${o}`).join(', ')}.`;
    }
    prompt += ` Simple, professional style, suitable for an online quiz.`;
    
    setActiveQuestionIndex(index);
    setGeneratePrompt(prompt);
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
      {/* Hidden file input for question image uploading */}
      <input
        ref={imageFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={(e) => {
          if (e.target.files && e.target.files[0] && activeQuestionIndex !== null) {
            handleFileUpload(activeQuestionIndex, e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* Header with breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <button onClick={() => router.push("/admin/quizzes")} className="hover:text-black transition-colors">Quizzes</button>
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
        <div className="space-y-6 max-w-4xl">
          {/* Generator Type Selection */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-base font-bold mb-4">Select Generator Type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                type="button"
                onClick={() => setGeneratorType("topic")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  generatorType === "topic" ? "border-purple-600 bg-purple-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className={`w-6 h-6 ${generatorType === "topic" ? "text-purple-600" : "text-gray-400"}`} />
                  <span className="font-medium text-gray-900">AI Topic Quiz</span>
                </div>
                <p className="text-xs text-gray-500">Generate quiz from a text topic</p>
              </button>
              
              <button
                type="button"
                onClick={() => setGeneratorType("video")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  generatorType === "video" ? "border-purple-600 bg-purple-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Video className={`w-6 h-6 ${generatorType === "video" ? "text-purple-600" : "text-gray-400"}`} />
                  <span className="font-medium text-gray-900">Video Quiz</span>
                </div>
                <p className="text-xs text-gray-500">Generate quiz from a video file</p>
              </button>

              <button
                type="button"
                onClick={() => setGeneratorType("audio")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  generatorType === "audio" ? "border-purple-600 bg-purple-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Mic className={`w-6 h-6 ${generatorType === "audio" ? "text-purple-600" : "text-gray-400"}`} />
                  <span className="font-medium text-gray-900">Audio Quiz</span>
                </div>
                <p className="text-xs text-gray-500">Generate quiz from an audio file</p>
              </button>

              <button
                type="button"
                onClick={() => setGeneratorType("document")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  generatorType === "document" ? "border-purple-600 bg-purple-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <FileText className={`w-6 h-6 ${generatorType === "document" ? "text-purple-600" : "text-gray-400"}`} />
                  <span className="font-medium text-gray-900">Document Quiz</span>
                </div>
                <p className="text-xs text-gray-500">Generate quiz from a document file</p>
              </button>
            </div>
          </div>

          {/* Generator-specific content */}
          <AnimatePresence mode="wait">
            {generatorType === "topic" ? (
              <motion.div
                key="topic"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm"
              >
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
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-black outline-none"
                    />
                  </div>

                  {error && <p className="text-red-500 text-sm bg-red-50 p-2.5 rounded-lg border border-red-100">{error}</p>}
                </form>
              </motion.div>
            ) : (
              <motion.div
                key={generatorType}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm"
              >
                <QuizGeneratorForm
                  fileType={generatorType as FileType}
                  onQuizGenerated={(quiz) => {
                    setGeneratedQuiz(quiz);
                    setStep("preview");
                  }}
                  onBack={() => setGeneratorType("topic")}
                  numQuestions={questionCount}
                  setNumQuestions={setQuestionCount}
                  difficulty={difficulty}
                  setDifficulty={setDifficulty}
                  onFileStateChange={(hasFile, isGen) => {
                    setFileHasFile(hasFile);
                    setFileIsGenerating(isGen);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quiz Settings */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900">Quiz Settings</h2>
            
            {/* Row 1: Category | Total Marks | Number of Questions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                <input
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-black outline-none"
                  placeholder="e.g. Programming, Science"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-black outline-none"
                  placeholder="e.g. 10, 20, 50"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Marks per question = {totalMarks} ÷ {questionCount} = {Number((totalMarks / questionCount).toFixed(1))}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Questions <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-black outline-none"
                  placeholder="e.g. 5"
                />
              </div>
            </div>

            {/* Row 2: Difficulty | Negative Marks Per Wrong Answer | Duration (min) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty <span className="text-red-500">*</span></label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-black outline-none"
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                  <option>Mixed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Negative Marks Per Wrong Answer
                </label>
                <input
                  type="number"
                  min={0}
                  max={99.99}
                  step={0.01}
                  value={negativeMarks}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setNegativeMarks(isNaN(v) ? 0 : Math.max(0, parseFloat(v.toFixed(2))));
                  }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-black outline-none"
                  placeholder="e.g. 0.25"
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
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-black outline-none"
                  placeholder="e.g. 30"
                />
              </div>
            </div>

            {/* Row 3: Quiz Visibility | Start Date | End Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quiz Visibility <span className="text-red-500">*</span>
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as "public" | "private")}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-black outline-none"
                >
                  <option value="private">Private (No leaderboard)</option>
                  <option value="public">Public (Show leaderboard)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-black outline-none"
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
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-black outline-none"
                />
              </div>
            </div>
          </div>

          {/* Generate Quiz Button */}
          {generatorType === "topic" ? (
            <button
              onClick={handleGenerate as any}
              disabled={loading || !topic.trim()}
              className="w-full py-3 bg-black text-white rounded-xl flex justify-center items-center gap-2 hover:bg-gray-900 transition-colors disabled:opacity-50 font-medium text-sm"
            >
              {loading && <Loader2 className="animate-spin" size={16} />}
              <Sparkles size={16} />
              {loading ? "Generating Quiz…" : "Generate Quiz"}
            </button>
          ) : (
            <button
              id="file-generate-quiz-btn"
              disabled={!fileHasFile || fileIsGenerating}
              onClick={() => {
                const btn = document.getElementById("quiz-generator-form-trigger") as HTMLButtonElement | null;
                btn?.click();
              }}
              className="w-full py-3 bg-black text-white rounded-xl flex justify-center items-center gap-2 hover:bg-gray-900 transition-colors disabled:opacity-50 font-medium text-sm"
            >
              {fileIsGenerating && <Loader2 className="animate-spin" size={16} />}
              <Sparkles size={16} />
              {fileIsGenerating ? "Generating Quiz…" : "Generate Quiz"}
            </button>
          )}
        </div>
      )}

      {/* ── Step 2: Preview & Edit ─────────────────────────────────────────────── */}
      {step === "preview" && generatedQuiz && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          {/* Action bar */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <Edit3 size={16} className="text-gray-500" />
                Preview & Edit
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {generatedQuiz.questions.length} questions · {computedTotalMarks} total marks
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleRegenerate}
                disabled={saving || generatingAllImages}
                className="flex items-center justify-center gap-1.5 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw size={14} /> Regenerate
              </button>
              <button
                onClick={handleGenerateAllImages}
                disabled={saving || generatingAllImages}
                className="flex items-center justify-center gap-1.5 px-4 py-2 border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm disabled:opacity-50 transition-colors"
              >
                {generatingAllImages ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {generateAllProgress
                      ? `Generating ${generateAllProgress.done}/${generateAllProgress.total}…`
                      : "Generating…"}
                  </>
                ) : (
                  <>
                    <Image size={14} />
                    Generate Images for All
                  </>
                )}
              </button>
              <button
                onClick={() => setStep("save")}
                disabled={saving || generatingAllImages || generatedQuiz.questions.length === 0}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-900 disabled:opacity-50"
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
                      onClick={() => triggerFileInput(i)}
                      className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all hover:border-purple-400 bg-gray-50 flex flex-col items-center justify-center min-h-[120px]"
                    >
                      {uploadingImageIndex === i ? (
                        <div className="flex flex-col items-center gap-1">
                          <Loader2 className="animate-spin text-purple-600" size={24} />
                          <p className="text-xs text-gray-500">Uploading image to server...</p>
                        </div>
                      ) : (
                        <>
                          <Upload size={28} className="mx-auto text-gray-400 mb-2" />
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Drag and drop or click to upload
                          </p>
                          <p className="text-xs text-gray-500">
                            Supports PNG, JPG, JPEG, WEBP • Paste image from clipboard
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-xl p-3 bg-white">
                      <img
                        src={q.imageUrl}
                        alt="Question preview"
                        className="max-h-48 max-w-full object-contain mx-auto rounded-lg mb-3"
                      />
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => triggerFileInput(i)}
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
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-black"
                      placeholder="https://example.com/image.png"
                    />
                  </div>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {q.options.map((opt, oi) => (
                    <div key={oi}>
                      <label className="block text-xs font-medium mb-0.5 text-gray-500">
                        Option {["A", "B", "C", "D", "E", "F"][oi]} <span className="text-red-500">*</span>
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

                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Correct answer */}
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-0.5 text-green-600">Correct Answer <span className="text-red-500">*</span></label>
                    <select
                      value={q.correctAnswer}
                      onChange={(e) => updateQuestion(i, { correctAnswer: e.target.value })}
                      className="w-full px-2 py-1.5 border border-green-200 rounded-md text-sm outline-none focus:border-green-400"
                    >
                      <option value="" disabled>Select correct option</option>
                      {q.options.map((opt, oi) => (
                        <option key={oi} value={opt}>{opt || `Option ${["A", "B", "C", "D", "E", "F"][oi]}`}</option>
                      ))}
                    </select>
                  </div>

                  {/* Explanation */}
                  <div className="flex-[2]">
                    <label className="block text-xs font-medium mb-0.5 text-gray-600">Explanation (Optional)</label>
                    <input
                      value={q.explanation || ""}
                      onChange={(e) => updateQuestion(i, { explanation: e.target.value })}
                      placeholder="Why is this answer correct?"
                      className="w-full px-2 py-1.5 border rounded-md text-sm outline-none focus:border-black"
                    />
                  </div>
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
                  <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
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
