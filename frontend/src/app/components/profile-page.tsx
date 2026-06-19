"use client";

import { useAuth } from "./auth-context";
import { UserLayout } from "./user-layout";
import { apiGetStudentResults, QuizResult } from "./api";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Calendar, Mail, Trophy, Target, TrendingUp, CheckCircle2, Loader2 } from "lucide-react";

export function ProfilePage() {
  const { user } = useAuth();

  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      try {
        const data = await apiGetStudentResults();
        setResults(data);
      } catch (err) {
        console.error("Failed to fetch student results", err);
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, []);

  // Compute stats from fetched results
  const totalAttempts = results.length;
  const averageScore =
    totalAttempts > 0
      ? Math.round(results.reduce((sum, r) => sum + Number(r.percentage), 0) / totalAttempts)
      : 0;
  const highestScore =
    totalAttempts > 0 ? Math.max(...results.map((r) => Number(r.percentage)), 0) : 0;
  const passedCount = results.filter((r) => (r.percentage ?? 0) >= 60).length;

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString()
    : "Unknown";

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-black">Profile</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your account information and statistics</p>
        </div>

        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white border border-gray-100 rounded-xl p-6 mb-4"
        >
          <div className="flex items-start gap-4">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.fullName || user?.name || "User"}
                className="w-16 h-16 rounded-full bg-gray-100 object-cover border-2 border-gray-100"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-100 flex items-center justify-center text-xl font-semibold text-gray-600">
                {(user?.fullName || user?.name || "U")[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-base font-bold text-black">{user?.fullName || user?.name}</h2>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                <Mail size={13} />
                {user?.email}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                <Calendar size={13} />
                Joined {joinedDate}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {[
            { label: "Total Attempts", value: totalAttempts, icon: CheckCircle2, color: "text-blue-600" },
            { label: "Average Score", value: `${averageScore}%`, icon: Target, color: "text-green-600" },
            { label: "Highest Score", value: `${highestScore}%`, icon: TrendingUp, color: "text-purple-600" },
            { label: "Quizzes Passed", value: passedCount, icon: Trophy, color: "text-amber-600" },
            { label: "Pass Rate", value: `${Math.round((passedCount / (totalAttempts || 1)) * 100)}%`, icon: Target, color: "text-teal-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white border border-gray-100 rounded-xl p-4"
            >
              <Icon size={15} className={`mb-2 ${color}`} />
              <p className="text-xl font-bold text-black">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Recent activity */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-black mb-2" size={24} />
            <p className="text-sm text-gray-500">Loading activity...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-5 text-center text-gray-400">
            No recent activity available.
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-black mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {results.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-black">{item.quiz?.title || "Quiz"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-black">{item.percentage}%</p>
                    <p className="text-xs text-gray-400">Score</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
