"use client";

import { useState, useEffect } from "react";
import { apiGetLeaderboard, LeaderboardResponse, getErrorMessage } from "./api";
import { Loader2, ChevronLeft, ChevronRight, Trophy } from "lucide-react";

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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-black">Leaderboard</h2>
        {hasMultiple && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQuizChange(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="p-2 text-gray-400 hover:text-black disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-black min-w-[150px] text-center">
              {data.currentQuizTitle}
            </span>
            <button
              onClick={() => handleQuizChange(Math.min(data.publicQuizzes.length - 1, currentIndex + 1))}
              disabled={currentIndex === data.publicQuizzes.length - 1}
              className="p-2 text-gray-400 hover:text-black disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {!hasMultiple && (
        <h3 className="text-base font-semibold text-gray-800">{data.currentQuizTitle}</h3>
      )}

      {data.leaderboard.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl py-12 text-center text-gray-400">
          No attempts yet for this quiz.
        </div>
      ) : (
        <div className="space-y-3">
          {data.leaderboard.map((entry) => {
            let rankStyle = "";
            if (entry.rank === 1) {
              rankStyle = "bg-yellow-50 border-yellow-200";
            } else if (entry.rank === 2) {
              rankStyle = "bg-gray-50 border-gray-200";
            } else if (entry.rank === 3) {
              rankStyle = "bg-amber-50 border-amber-200";
            } else {
              rankStyle = "bg-white border-gray-100";
            }

            return (
              <div
                key={entry.studentName + entry.attemptDate}
                className={`border rounded-xl p-5 flex items-center justify-between ${rankStyle}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
                    {entry.rank === 1 && <Trophy size={16} className="text-yellow-500" />}
                    {entry.rank === 2 && <Trophy size={14} className="text-gray-400" />}
                    {entry.rank === 3 && <Trophy size={12} className="text-amber-600" />}
                    {entry.rank > 3 && <span className="text-gray-500">{entry.rank}</span>}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-black">{entry.studentName}</p>
                    <p className="text-xs text-gray-500">Attempted on {new Date(entry.attemptDate).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
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
