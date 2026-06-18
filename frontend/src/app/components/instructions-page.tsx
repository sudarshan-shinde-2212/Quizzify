import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { UserLayout } from "./user-layout";
import { apiGetStudentQuiz, Quiz } from "./api";
import { motion } from "motion/react";
import {
  AlertTriangle, Clock, HelpCircle, Trophy, CheckCircle2,
  Monitor, Wifi, RefreshCw, ChevronRight, ArrowLeft, Loader2
} from "lucide-react";

const rules = [
  { icon: CheckCircle2, text: "You are allowed only one attempt for this assessment." },
  { icon: Clock, text: "The timer starts immediately when you click Start Quiz." },
  { icon: RefreshCw, text: "The quiz is auto-submitted when the timer reaches zero." },
  { icon: Monitor, text: "Do not refresh the page during the assessment." },
  { icon: Wifi, text: "Do not close the browser tab or window." },
  { icon: Monitor, text: "Tab switching is actively monitored throughout the session." },
  { icon: AlertTriangle, text: "Maximum 3 tab switches are allowed before auto-submit." },
  { icon: Wifi, text: "Attempting from multiple devices simultaneously is prohibited." },
];

export function InstructionsPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadQuiz() {
      if (!quizId) return;
      try {
        const data = await apiGetStudentQuiz(quizId);
        setQuiz(data);
      } catch (err) {
        console.error("Failed to load quiz details", err);
        setError("Could not load instructions. The quiz might not be active or available.");
      } finally {
        setLoading(false);
      }
    }
    loadQuiz();
  }, [quizId]);

  if (loading) {
    return (
      <UserLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-black mb-2" size={24} />
          <p className="text-sm text-gray-500">Loading instructions…</p>
        </div>
      </UserLayout>
    );
  }

  if (error || !quiz) {
    return (
      <UserLayout>
        <div className="max-w-2xl mx-auto py-12 text-center">
          <p className="text-red-500 font-medium mb-4">{error || "Quiz not found."}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-1.5 text-sm text-black underline"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition-colors mb-5"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Quiz header */}
          <div className="bg-white border border-gray-100 rounded-xl p-6 mb-4">
            <h1 className="text-lg font-bold text-black mb-1">{quiz.title}</h1>
            <p className="text-sm text-gray-500 mb-4">{quiz.description}</p>
            <div className="flex flex-wrap gap-4">
              {[
                { icon: Clock, label: `${quiz.durationInMinutes} minutes` },
                { icon: Trophy, label: `${quiz.totalMarks} marks` },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Icon size={14} /> {label}
                </div>
              ))}
            </div>
          </div>

          {/* Rules card */}
          <div className="bg-white border border-gray-100 rounded-xl p-6 mb-4">
            <h2 className="text-sm font-bold text-black mb-4 uppercase tracking-wide">
              Quizzify Assessment Rules
            </h2>
            <div className="space-y-3">
              {rules.map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={11} className="text-gray-600" />
                  </div>
                  <p className="text-sm text-gray-600 leading-snug">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3">
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 mb-0.5">Tab Switch Warning</p>
              <p className="text-sm text-amber-700">
                After 3 tab switches your assessment may be automatically submitted and your attempt will be recorded.
              </p>
            </div>
          </div>

          {/* Agreement */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 mb-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="sr- SR-ONLY"
                  style={{ display: "none" }}
                />
                <div
                  onClick={() => setAgreed(!agreed)}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
                    agreed ? "bg-black border-black" : "border-gray-300 bg-white"
                  }`}
                >
                  {agreed && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3L3.5 5.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-gray-700 ml-3">
                I have read and agree to all assessment rules. I understand that violations may result in automatic submission.
              </span>
            </label>
          </div>

          <button
            disabled={!agreed}
            onClick={() => navigate(`/quiz/${quizId}`)}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              agreed
                ? "bg-black text-white hover:bg-gray-900 shadow-sm"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Start Assessment <ChevronRight size={16} />
          </button>
        </motion.div>
      </div>
    </UserLayout>
  );
}
