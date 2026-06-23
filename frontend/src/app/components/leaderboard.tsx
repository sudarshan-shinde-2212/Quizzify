"use client";

import { useState, useEffect } from "react";
import { apiGetLeaderboard, LeaderboardResponse, getErrorMessage } from "./api";
import { Loader2, Trophy } from "lucide-react";

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
          {data.leaderboard.map((entry) => {
            let rankStyle = "";
            let rankBg = "bg-white border-gray-100";
            let trophyIcon: React.ReactNode = null;
            
            if (entry.rank === 1) {
              rankBg = "bg-yellow-50 border-yellow-300";
              trophyIcon = <Trophy size={20} className="text-yellow-600" />;
            } else if (entry.rank === 2) {
              rankBg = "bg-gray-100 border-gray-400";
              trophyIcon = <Trophy size={18} className="text-gray-500" />;
            } else if (entry.rank === 3) {
              rankBg = "bg-amber-50 border-amber-400";
              trophyIcon = <Trophy size={16} className="text-amber-600" />;
            }

            return (
              <div
                key={entry.studentName + entry.attemptDate}
                className={`border rounded-xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${rankBg}`}
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-white shadow-sm border border-gray-200">
                    {trophyIcon || (
                      <span className="text-base md:text-lg font-bold text-gray-500">{entry.rank}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-black">{entry.studentName}</p>
                    <div className="flex flex-col gap-1 text-xs text-gray-500">
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
          })}
        </div>
      )}
    </div>
  );
}
