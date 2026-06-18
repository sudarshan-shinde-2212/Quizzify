import { useLocation, useNavigate } from "react-router";
import { UserLayout } from "./user-layout";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, MinusCircle, Clock, Trophy, ArrowLeft, Download, BarChart2 } from "lucide-react";

interface ResultState {
  score: number;
  total: number;
  correct: number;
  incorrect: number;
  skipped: number;
  timeTaken: number;
  quizTitle: string;
  percentage: number;
  rank?: number;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export function ResultsPage() {
  const { state } = useLocation() as { state: ResultState | null };
  const navigate = useNavigate();

  if (!state) {
    return (
      <UserLayout>
        <div className="py-20 text-center">
          <p className="text-gray-400 mb-4">No result data found.</p>
          <button onClick={() => navigate("/dashboard")} className="text-sm text-black underline">
            Go to Dashboard
          </button>
        </div>
      </UserLayout>
    );
  }

  const { score, total, correct, incorrect, skipped, timeTaken, quizTitle, percentage, rank } = state;
  const passed = percentage >= 60;
  const questionTotal = correct + incorrect + skipped;
  const getPct = (value: number) => (questionTotal > 0 ? (value / questionTotal) * 100 : 0);

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Result header */}
          <div className={`rounded-2xl p-8 text-center mb-5 ${passed ? "bg-black text-white" : "bg-gray-900 text-white"}`}>
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <Trophy size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-1">
              {passed ? "Well Done!" : "Keep Practicing"}
            </h1>
            <p className="text-white/60 text-sm mb-5">{quizTitle}</p>
            <div className="text-5xl font-bold mb-2">{percentage}%</div>
            <p className="text-white/70 text-sm">
              {score} / {total} marks{rank ? ` - Rank #${rank}` : ""}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Correct", value: correct, icon: CheckCircle2, color: "text-green-600" },
              { label: "Incorrect", value: incorrect, icon: XCircle, color: "text-red-500" },
              { label: "Skipped", value: skipped, icon: MinusCircle, color: "text-gray-400" },
              { label: "Time Taken", value: formatTime(timeTaken), icon: Clock, color: "text-blue-600" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white border border-gray-100 rounded-xl p-4 text-center">
                <Icon size={18} className={`mx-auto mb-1.5 ${color}`} />
                <div className="text-lg font-bold text-black">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>

          {/* Score breakdown */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 mb-5">
            <h3 className="text-sm font-semibold text-black mb-4 flex items-center gap-2">
              <BarChart2 size={14} /> Score Breakdown
            </h3>
            <div className="space-y-3">
              {[
                { label: "Correct answers", pct: getPct(correct), color: "bg-green-500" },
                { label: "Incorrect answers", pct: getPct(incorrect), color: "bg-red-400" },
                { label: "Skipped", pct: getPct(skipped), color: "bg-gray-200" },
              ].map(({ label, pct, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{label}</span>
                    <span>{Math.round(pct)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className={`h-1.5 rounded-full ${color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              <ArrowLeft size={14} /> Dashboard
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-900"
            >
              <Download size={14} /> Download Report
            </button>
          </div>
        </motion.div>
      </div>
    </UserLayout>
  );
}
