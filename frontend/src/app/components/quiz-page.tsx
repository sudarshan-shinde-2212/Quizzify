"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  apiGetStudentQuiz,
  apiStartQuizAttempt,
  apiSubmitQuizAttempt,
  getErrorMessage,
  Quiz,
  Question,
} from "./api";
import { useAuth } from "./auth-context";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock, ChevronLeft, ChevronRight, AlertTriangle, Send,
  RotateCcw, Bookmark, CheckSquare, Loader2
} from "lucide-react";

/** Fisher-Yates shuffle – returns a new array */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type AnswerMap = Record<string, number | null>;
type QuestionStatus = "answered" | "marked" | "skipped" | "unanswered";

function useTimer(initialSeconds: number, onExpire: () => void, isLoaded: boolean) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!isLoaded) return;
    setSeconds(initialSeconds);
    const endTime = Date.now() + initialSeconds * 1000;

    const interval = setInterval(() => {
      const remaining = Math.round((endTime - Date.now()) / 1000);
      if (remaining <= 0) {
        setSeconds(0);
        onExpireRef.current();
        clearInterval(interval);
      } else {
        setSeconds(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [initialSeconds, isLoaded]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isLow = seconds < 120;

  return { minutes, secs, seconds, isLow };
}

type ModalType = "tab-switch" | "security-warning" | "final-warning" | "submitted" | "confirm-submit" | "time-up" | "time-up-no-auto" | "incomplete" | null;

function Modal({ type, tabCount, onClose, onSubmit, settings, unansweredCount }: {
  type: ModalType;
  tabCount: number;
  onClose: () => void;
  onSubmit: () => void;
  settings: any;
  unansweredCount?: number;
}) {
  if (!type) return null;

  const configs = {
    "tab-switch": {
      title: "Tab Switch Detected",
      icon: <AlertTriangle size={24} className="text-amber-500" />,
      bg: "bg-amber-50",
      border: "border-amber-200",
      body: `You have switched tabs ${tabCount} time${tabCount > 1 ? "s" : ""}. You are allowed a maximum of ${settings?.maxTabSwitches ?? 3} tab switches. Further violations may result in automatic submission.`,
      action: "I Understand",
      actionFn: onClose,
      showClose: true,
    },
    "security-warning": {
      title: "Security Warning",
      icon: <AlertTriangle size={24} className="text-orange-500" />,
      bg: "bg-orange-50",
      border: "border-orange-200",
      body: `This is your last warning! One more switch will auto-submit your assessment.`,
      action: "Continue Assessment",
      actionFn: onClose,
      showClose: false,
    },
    "final-warning": {
      title: "Final Warning",
      icon: <AlertTriangle size={24} className="text-red-500" />,
      bg: "bg-red-50",
      border: "border-red-200",
      body: `You have exceeded the maximum allowed tab switches (${settings?.maxTabSwitches ?? 3}). Your assessment is being submitted automatically.`,
      action: "OK",
      actionFn: onSubmit,
      showClose: false,
    },
    "confirm-submit": {
      title: "Submit Assessment?",
      icon: <Send size={24} className="text-black" />,
      bg: "bg-gray-50",
      border: "border-gray-200",
      body: "Are you sure you want to submit your assessment? This action cannot be undone.",
      action: "Submit Now",
      actionFn: onSubmit,
      showClose: true,
    },
    "submitted": {
      title: "Assessment Submitted",
      icon: <CheckSquare size={24} className="text-green-500" />,
      bg: "bg-green-50",
      border: "border-green-200",
      body: "Your responses have been recorded successfully. You will be redirected to your history shortly.",
      action: "View History",
      actionFn: onSubmit,
      showClose: false,
    },
    "time-up": {
      title: "Time's Up!",
      icon: <Clock size={24} className="text-red-500" />,
      bg: "bg-red-50",
      border: "border-red-200",
      body: "Your time has expired. Your assessment is being submitted automatically.",
      action: "OK",
      actionFn: onSubmit,
      showClose: false,
    },
    "time-up-no-auto": {
      title: "Time's Up!",
      icon: <Clock size={24} className="text-orange-500" />,
      bg: "bg-orange-50",
      border: "border-orange-200",
      body: "Your time has expired. Please submit your assessment manually.",
      action: "Submit Now",
      actionFn: onSubmit,
      showClose: false,
    },
    "incomplete": {
      title: "⚠️ Incomplete Exam Submission",
      icon: <AlertTriangle size={24} className="text-red-500" />,
      bg: "bg-red-50",
      border: "border-red-200",
      body: `You cannot submit the exam because ${unansweredCount} question${unansweredCount > 1 ? "s" : ""} remain unanswered. All questions are mandatory and must be answered before the exam can be submitted. Please complete the remaining questions and try again.`,
      action: "Complete Questions",
      actionFn: onClose,
      showClose: false,
    },
  };

  const config = configs[type];
  if (!config) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
      >
        <div className={`w-12 h-12 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center mb-4`}>
          {config.icon}
        </div>
        <h3 className="text-base font-bold text-black mb-2">{config.title}</h3>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">{config.body}</p>
        <div className="flex gap-3">
          {config.showClose && (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={config.actionFn}
            className="flex-1 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-900"
          >
            {config.action}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function QuizPage() {
  const params = useParams();
  const quizId = params?.quizId as string;
  const router = useRouter();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [tabSwitches, setTabSwitches] = useState(0);
  const [modal, setModal] = useState<ModalType>(null);
  const [startTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);

  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    async function loadQuizData() {
      if (!quizId || quizId === "undefined") return;
      try {
        // Load settings and quiz data in parallel
        const [quizData, settingsData] = await Promise.all([
          apiGetStudentQuiz(quizId),
          import("./api").then(({ apiGetSettings }) => apiGetSettings()).catch(() => ({})),
        ]);

        setQuiz(quizData);
        const s = settingsData || {};
        if (s.maintenanceMode) {
          router.replace("/dashboard");
          return;
        }
        setSettings(s);

        // Start the attempt on the backend
        await apiStartQuizAttempt(quizId);

        // Apply shuffle immediately after we have both quiz data and settings
        const rawQuestions = quizData.questions || [];
        setQuestions(s.questionShuffle ? shuffle(rawQuestions) : rawQuestions);
      } catch (err) {
        console.error("Failed to start quiz", err);
        const message = getErrorMessage(err, "");
        if (message.toLowerCase().includes("already attempted") || message.toLowerCase().includes("retakes are not allowed")) {
          router.replace(`/already-attempted?quizId=${quizId}`);
          return;
        }
        setError("Failed to load/start the quiz attempt. Please make sure the quiz is active.");
      } finally {
        setLoading(false);
      }
    }
    loadQuizData();
  }, [quizId, router]);

  // Helper to get unanswered questions and first index
  const getUnansweredInfo = useCallback(() => {
    const unansweredIndices: number[] = [];
    questions.forEach((q, index) => {
      if (answers[q.id] === undefined || answers[q.id] === null) {
        unansweredIndices.push(index);
      }
    });
    return {
      unansweredCount: unansweredIndices.length,
      firstUnansweredIndex: unansweredIndices.length > 0 ? unansweredIndices[0] : null,
    };
  }, [questions, answers]);

  // Validate answers and show incomplete modal if needed
  const validateAndTrySubmit = useCallback(() => {
    const { unansweredCount, firstUnansweredIndex } = getUnansweredInfo();
    if (unansweredCount > 0) {
      // Show incomplete modal, when closed scroll to first unanswered question
      setModal("incomplete");
      // Wait for modal to close then scroll
      return;
    }
    // Proceed to confirm submission
    setModal("confirm-submit");
  }, [getUnansweredInfo]);

  const handleSubmit = useCallback(async () => {
    if (!quizId || !quiz || submitting) return;
    const { unansweredCount } = getUnansweredInfo();
    if (unansweredCount > 0) {
      setModal("incomplete");
      return;
    }
    setSubmitting(true);
    try {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);

      // Map answer choices [0-3] to ['A', 'B', 'C', 'D']
      const formattedAnswers = Object.entries(answers)
        .filter(([_, val]) => val !== null && val !== undefined)
        .map(([qId, val]) => ({
          questionId: qId,
          selectedOption: ["A", "B", "C", "D"][val as number] as "A" | "B" | "C" | "D",
        }));

      const res = await apiSubmitQuizAttempt(quizId, formattedAnswers);

      sessionStorage.setItem("quizResult", JSON.stringify({
        score: res.score,
        total: quiz.totalMarks,
        correct: res.correctAnswers,
        incorrect: res.wrongAnswers,
        skipped: res.totalQuestions - res.correctAnswers - res.wrongAnswers,
        timeTaken,
        quizTitle: quiz.title,
        percentage: res.percentage,
      }));

      router.push("/history");
    } catch (err) {
      console.error("Failed to submit quiz", err);
      // If backend rejected because of incomplete (though we should have caught it frontend)
      alert("Submission failed. Please try again or check your internet connection.");
    } finally {
      setSubmitting(false);
    }
  }, [answers, router, quiz, quizId, startTime, submitting, getUnansweredInfo]);

  // Tab visibility monitoring
  useEffect(() => {
    if (loading || error || !settings) return;
    const maxSwitches = settings?.maxTabSwitches ?? 3;
    const handleVisibility = () => {
      if (document.hidden) {
        setTabSwitches((prev) => {
          const next = prev + 1;
          if (next >= maxSwitches) setModal("final-warning");
          else if (next === maxSwitches - 1) setModal("security-warning");
          else setModal("tab-switch");
          return next;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [loading, error, settings]);

  const { minutes, secs, isLow } = useTimer((quiz?.durationInMinutes ?? 30) * 60, () => {
    if (settings?.autoSubmit !== false) {
      setModal("time-up");
      handleSubmit();
    } else {
      setModal("time-up-no-auto");
    }
  }, !loading);

  const getQuestionStatus = (qId: string): QuestionStatus => {
    if (marked.has(qId)) return "marked";
    if (answers[qId] !== undefined && answers[qId] !== null) return "answered";
    return "unanswered";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-black" size={24} />
          <p className="text-sm text-gray-500">Starting assessment environment…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white border border-gray-100 rounded-xl p-8 max-w-md text-center shadow-sm">
          <AlertTriangle className="text-red-500 mx-auto mb-3" size={32} />
          <p className="text-sm font-semibold text-black mb-4">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-black text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-950 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];
  const answeredCount = Object.values(answers).filter((v) => v !== null && v !== undefined).length;
  const options = q ? [q.optionA, q.optionB, q.optionC, q.optionD] : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">


      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-13 flex items-center justify-between py-2.5">
          <div>
            <p className="text-sm font-semibold text-black leading-tight">{quiz?.title}</p>
            <p className="text-xs text-gray-400">Question {currentQ + 1} of {questions.length}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={validateAndTrySubmit}
              disabled={submitting}
              className="flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              Submit
            </button>
          </div>
        </div>
      </header>

      {questions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-20 text-center text-gray-400">
          This quiz doesn't have any questions yet.
        </div>
      ) : (
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-5 grid grid-cols-1 lg:grid-cols-[200px_1fr_200px] gap-4">
          {/* Left: Question Navigator */}
          <div className="hidden lg:block">
            <div className="bg-white border border-gray-100 rounded-xl p-4 sticky top-16">
              <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Questions</p>
              <div className="grid grid-cols-5 gap-1.5">
                {questions.map((q, i) => {
                  const status = getQuestionStatus(q.id);
                  const isUnanswered = status === "unanswered";
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQ(i)}
                      className={`w-8 h-8 text-xs font-medium rounded-md transition-colors ${
                        i === currentQ
                          ? "bg-black text-white"
                          : status === "answered"
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : status === "marked"
                          ? "bg-amber-100 text-amber-700 border border-amber-200"
                          : isUnanswered
                          ? "bg-red-50 text-red-600 border border-red-300 hover:border-red-400"
                          : "bg-gray-50 text-gray-500 border border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 space-y-1.5">
                {[
                  { color: "bg-green-100 border-green-200", label: "Answered" },
                  { color: "bg-amber-100 border-amber-200", label: "Marked" },
                  { color: "bg-red-50 border-red-300", label: "Unanswered" },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2 text-xs text-gray-500">
                    <div className={`w-3 h-3 rounded border ${color}`} />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center: Question */}
          <div>
            {/* Timer – centered above question */}
            <div className="flex justify-center mb-4">
              <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-base font-mono font-bold shadow-sm ${isLow ? "text-red-600 bg-red-50 border-red-200 animate-pulse" : "text-gray-800 bg-white border-gray-200"}`}>
                <Clock size={16} />
                {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQ}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className={`bg-white rounded-xl p-6 border-2 ${
                  getQuestionStatus(questions[currentQ].id) === "unanswered"
                    ? "border-red-400 bg-red-50"
                    : "border-gray-100"
                }`}
                style={{ position: "relative", overflow: "hidden" }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs text-gray-400 font-medium">Q{currentQ + 1}/{questions.length}</span>
                    <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{q.marks} marks</span>
                  </div>
                  <button
                    onClick={() => setMarked((prev) => {
                      const next = new Set(prev);
                      next.has(q.id) ? next.delete(q.id) : next.add(q.id);
                      return next;
                    })}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ${
                      marked.has(q.id) ? "bg-amber-100 text-amber-700" : "text-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    <Bookmark size={12} /> {marked.has(q.id) ? "Marked" : "Mark"}
                  </button>
                </div>

                <p className="text-sm font-medium text-black mb-4 leading-relaxed">
                  {q.questionText}
                </p>

                <div className="space-y-2.5 mt-4">
                  {options.map((opt, oi) => {
                    const selected = answers[q.id] === oi;
                    return (
                      <button
                        key={oi}
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                        className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                          selected
                            ? "bg-black text-white border-black"
                            : "border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-white"
                        }`}
                      >
                        <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {/* Nav buttons */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
                  <div className="flex gap-2">
                    <button
                      disabled={currentQ === 0}
                      onClick={() => setCurrentQ((c) => c - 1)}
                      className="flex items-center gap-1.5 text-sm px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>
                    <button
                      disabled={currentQ === questions.length - 1}
                      onClick={() => setCurrentQ((c) => c + 1)}
                      className="flex items-center gap-1.5 text-sm px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: null }))}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5"
                  >
                    <RotateCcw size={12} /> Clear
                  </button>
                </div>

                {/* Watermark – 8 copies inside question box only */}
                {user?.email && (
                  <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 10 }}>
                    {Array.from({ length: 8 }).map((_, i) => {
                      const row = Math.floor(i / 4);
                      const col = i % 4;
                      return (
                        <span
                          key={i}
                          style={{
                            position: "absolute",
                            top: `${15 + row * 45}%`,
                            left: `${5 + col * 25}%`,
                            transform: "rotate(-30deg)",
                            fontSize: "clamp(10px, 1.4vw, 14px)",
                            color: "rgba(0,0,0,0.06)",
                            fontWeight: 600,
                            letterSpacing: "0.05em",
                            whiteSpace: "nowrap",
                            userSelect: "none",
                          }}
                        >
                          {user.email}
                        </span>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: Stats */}
          <div className="hidden lg:block">
            <div className="bg-white border border-gray-100 rounded-xl p-4 sticky top-16 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Progress</p>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1.5">
                  <div
                    className="bg-black h-1.5 rounded-full transition-all"
                    style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{answeredCount}/{questions.length} answered</p>
              </div>

              <div className="space-y-2">
                {[
                  { label: "Answered", value: answeredCount, color: "text-green-600" },
                  { label: "Marked", value: marked.size, color: "text-amber-600" },
                  { label: "Skipped", value: questions.length - answeredCount - marked.size, color: "text-gray-400" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-gray-500">{label}</span>
                    <span className={`font-semibold ${color}`}>{Math.max(0, value)}</span>
                  </div>
                ))}
              </div>

              {tabSwitches > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                  <p className="text-xs font-medium text-amber-700">Tab switches: {tabSwitches}/{settings?.maxTabSwitches ?? 3}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <Modal
            type={modal}
            tabCount={tabSwitches}
            onClose={() => {
              if (modal === "incomplete") {
                const { firstUnansweredIndex } = getUnansweredInfo();
                if (firstUnansweredIndex !== null) {
                  setCurrentQ(firstUnansweredIndex);
                }
              }
              setModal(null);
            }}
            onSubmit={() => {
              if (modal !== "incomplete") {
                setModal(null);
                handleSubmit();
              }
            }}
            settings={settings}
            unansweredCount={getUnansweredInfo().unansweredCount}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
