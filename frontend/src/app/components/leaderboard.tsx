"use client";

import { useState, useEffect } from "react";
import { apiGetLeaderboard, LeaderboardResponse, getErrorMessage } from "./api";
import { Loader2, Crown, Medal } from "lucide-react";

function formatCompletionTime(seconds: number | null): string {
  if (seconds === null) return "N/A";
  if (seconds < 60) {
    return `${seconds} sec`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) {
    return `${mins} min`;
  }
  return `${mins} min ${secs.toString().padStart(2, "0")} sec`;
}

interface PodiumCardProps {
  entry: {
    rank: number;
    studentName: string;
    score: number | null;
    percentage: number | null;
    attemptDate: string;
    completionTimeSeconds: number | null;
  };
}

function PodiumCard({ entry }: PodiumCardProps) {
  const rank = entry.rank;

  if (rank === 1) {
    return (
      <div
        className="relative rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #fde047 0%, #facc15 30%, #f59e0b 70%, #d97706 100%)",
          boxShadow: "0 0 24px 4px rgba(251, 191, 36, 0.45), 0 8px 32px rgba(217, 119, 6, 0.25)",
        }}
      >
        {/* Subtle shimmer overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(120deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.12) 100%)",
          }}
        />
        <div className="flex items-center gap-4 relative z-10">
          {/* Rank badge */}
          <div
            className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(255,255,255,0.25)",
              border: "2px solid rgba(255,255,255,0.5)",
              backdropFilter: "blur(4px)",
            }}
          >
            <Crown size={22} className="text-white drop-shadow" />
          </div>
          <div>
            <p className="text-base font-bold text-white drop-shadow">{entry.studentName}</p>
            <div className="flex flex-col gap-0.5 mt-0.5">
              <span className="text-xs text-yellow-100 opacity-90">
                Attempted: {new Date(entry.attemptDate).toLocaleDateString()}
              </span>
              <span className="text-xs text-yellow-100 opacity-90 flex items-center gap-1">
                ⏱ {formatCompletionTime(entry.completionTimeSeconds)}
              </span>
            </div>
          </div>
        </div>
        <div className="text-left md:text-right relative z-10">
          <p className="text-2xl font-extrabold text-white drop-shadow">{entry.percentage}%</p>
          <p className="text-xs text-yellow-100 opacity-90 font-medium">Score: {entry.score}</p>
        </div>
      </div>
    );
  }

  if (rank === 2) {
    return (
      <div
        className="relative rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 30%, #94a3b8 70%, #64748b 100%)",
          boxShadow: "0 4px 20px rgba(100, 116, 139, 0.30), 0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(120deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.14) 100%)",
          }}
        />
        <div className="flex items-center gap-4 relative z-10">
          <div
            className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(255,255,255,0.28)",
              border: "2px solid rgba(255,255,255,0.55)",
              backdropFilter: "blur(4px)",
            }}
          >
            <Medal size={20} className="text-white drop-shadow" />
          </div>
          <div>
            <p className="text-base font-bold text-white drop-shadow">{entry.studentName}</p>
            <div className="flex flex-col gap-0.5 mt-0.5">
              <span className="text-xs text-slate-100 opacity-90">
                Attempted: {new Date(entry.attemptDate).toLocaleDateString()}
              </span>
              <span className="text-xs text-slate-100 opacity-90 flex items-center gap-1">
                ⏱ {formatCompletionTime(entry.completionTimeSeconds)}
              </span>
            </div>
          </div>
        </div>
        <div className="text-left md:text-right relative z-10">
          <p className="text-2xl font-extrabold text-white drop-shadow">{entry.percentage}%</p>
          <p className="text-xs text-slate-100 opacity-90 font-medium">Score: {entry.score}</p>
        </div>
      </div>
    );
  }

  if (rank === 3) {
    return (
      <div
        className="relative rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #fdba74 0%, #f97316 35%, #b45309 75%, #92400e 100%)",
          boxShadow: "0 4px 20px rgba(180, 83, 9, 0.30), 0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(120deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.1) 100%)",
          }}
        />
        <div className="flex items-center gap-4 relative z-10">
          <div
            className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "2px solid rgba(255,255,255,0.45)",
              backdropFilter: "blur(4px)",
            }}
          >
            <Medal size={18} className="text-white drop-shadow" />
          </div>
          <div>
            <p className="text-base font-bold text-white drop-shadow">{entry.studentName}</p>
            <div className="flex flex-col gap-0.5 mt-0.5">
              <span className="text-xs text-orange-100 opacity-90">
                Attempted: {new Date(entry.attemptDate).toLocaleDateString()}
              </span>
              <span className="text-xs text-orange-100 opacity-90 flex items-center gap-1">
                ⏱ {formatCompletionTime(entry.completionTimeSeconds)}
              </span>
            </div>
          </div>
        </div>
        <div className="text-left md:text-right relative z-10">
          <p className="text-2xl font-extrabold text-white drop-shadow">{entry.percentage}%</p>
          <p className="text-xs text-orange-100 opacity-90 font-medium">Score: {entry.score}</p>
        </div>
      </div>
    );
  }

  // Ranks 4+ — clean neutral card
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center gap-3 md:gap-4">
        <div className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center bg-gray-50 border border-gray-200 flex-shrink-0">
          <span className="text-sm font-bold text-gray-500">{entry.rank}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-black">{entry.studentName}</p>
          <div className="flex flex-col gap-1 text-xs text-gray-500 mt-0.5">
            <span>Attempted: {new Date(entry.attemptDate).toLocaleDateString()}</span>
            <span className="flex items-center gap-1">
              ⏱ Completed in {formatCompletionTime(entry.completionTimeSeconds)}
            </span>
          </div>
        </div>
      </div>
      <div className="text-left md:text-right w-full md:w-auto">
        <p className="text-lg font-bold text-black">{entry.percentage}%</p>
        <p className="text-xs text-gray-500">Score: {entry.score}</p>
      </div>
    </div>
  );
}

export function Leaderboard() {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);

  const loadLeaderboard = async (quizId?: string) => {
    try {
      const response = await apiGetLeaderboard(quizId);
      setData(response);
      if (response.currentQuizId) {
        setCurrentQuizId(response.currentQuizId);
      }
    } catch (err) {
      console.error("Failed to load leaderboard", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const handleQuizChange = (index: number) => {
    if (data?.publicQuizzes[index]) {
      loadLeaderboard(data.publicQuizzes[index].id);
    }
  };

  const currentIndex = data?.publicQuizzes.findIndex(q => q.id === currentQuizId) ?? 0;
  const hasMultiple = data?.publicQuizzes && data.publicQuizzes.length > 1;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-black mb-2" size={24} />
        <p className="text-sm text-gray-500">Loading leaderboard…</p>
      </div>
    );
  }

  if (!data || data.publicQuizzes.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl py-16 text-center text-gray-400">
        No public quizzes with leaderboards available yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-black">Leaderboard</h2>
        <select
          value={currentQuizId || ""}
          onChange={(e) => loadLeaderboard(e.target.value)}
          className="w-full md:w-auto px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
        >
          {data.publicQuizzes.map((quiz) => (
            <option key={quiz.id} value={quiz.id}>
              {quiz.title}
            </option>
          ))}
        </select>
      </div>

      {data.leaderboard.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl py-12 text-center text-gray-400">
          No attempts yet for this quiz.
        </div>
      ) : (
        <div className="space-y-3">
          {data.leaderboard.map((entry) => (
            <PodiumCard key={entry.studentName + entry.attemptDate} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
