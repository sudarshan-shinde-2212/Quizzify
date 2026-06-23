"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-context";
import { UserLayout } from "./user-layout";
import { apiGetStudentQuizzes, apiGetStudentResults, apiGetSettings, Quiz, QuizResult } from "./api";
import { motion } from "motion/react";
import {
  Clock, HelpCircle, Trophy, Calendar, CheckCircle2, Lock,
  ChevronRight, Zap, Loader2, Search
} from "lucide-react";

type QuizStatus = "live" | "upcoming" | "closed";

const statusConfig: Record<QuizStatus | "attempted", { label: string; color: string; bg: string }> = {
  live: { label: "Live", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  upcoming: { label: "Upcoming", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  closed: { label: "Closed", color: "text-gray-500", bg: "bg-gray-50 border-gray-200" },
  attempted: { label: "Attempted", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
};

export function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<(Quiz & { status: QuizStatus; attempted?: boolean; score?: number })[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    averageScore: 0,
    highestScore: 0,
    liveCount: 0,
  });

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [activeQuizzes, results, settingsData] = await Promise.all([
          apiGetStudentQuizzes(),
          apiGetStudentResults(),
          apiGetSettings().catch(() => ({})),
        ]);

        // Check maintenance mode
        if (settingsData?.maintenanceMode) {
          setMaintenanceMode(true);
          setLoading(false);
          return;
        }

        // Cross-reference attempts with results
        const attemptedIds = new Map(results.map((r) => [r.quizId, r]));
        const enrichedQuizzes = activeQuizzes.map((q) => {
          const attempt = attemptedIds.get(q.id);
          const now = new Date();
          const start = new Date(q.startDate);
          const end = new Date(q.endDate);

          let status: QuizStatus = "live";
          if (now < start) status = "upcoming";
          else if (now > end) status = "closed";

          return {
            ...q,
            status,
            attempted: !!attempt,
            score: attempt ? attempt.score : undefined,
          };
        });

        // Compute student stats
        const totalAttempts = results.length;
        const totalPct = results.reduce((sum, r) => sum + Number(r.percentage), 0);
        const averageScore = totalAttempts > 0 ? Math.round(totalPct / totalAttempts) : 0;
        const highestScore = totalAttempts > 0 ? Math.max(...results.map((r) => Number(r.percentage)), 0) : 0;
        const liveCount = enrichedQuizzes.filter((q) => q.status === "live" && !q.attempted).length;

        setQuizzes(enrichedQuizzes);
        setStats({ totalAttempts, averageScore, highestScore, liveCount });
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const filteredQuizzes = quizzes.filter(q => 
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    q.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <UserLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-black mb-2" size={24} />
          <p className="text-sm text-gray-500">Loading assessments…</p>
        </div>
      </UserLayout>
    );
  }

  if (maintenanceMode) {
    return (
      <UserLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4">
            <span className="text-3xl">🛠️</span>
          </div>
          <h2 className="text-lg font-bold text-black mb-2">Platform Under Maintenance</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            The platform is currently undergoing maintenance. Please check back later.
          </p>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      {/* Top Row - Welcome + Available Assessments */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex-shrink-0">
          <h1 className="text-xl font-bold text-black">
            Welcome back, {user?.fullName?.split(" ")[0] || user?.name?.split(" ")[0]}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {stats.liveCount > 0
              ? `${stats.liveCount} quiz${stats.liveCount > 1 ? "zes" : ""} available to take`
            : "No new quizzes available right now"}
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide pt-1">
            Available Assessments
          </h2>
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search assessments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
            />
          </div>
        </div>
      </div>

      <div className="w-full">
        {/* Available Assessments (80% Desktop, 70% Tablet) */}
        <div className="w-full md:w-[70%] lg:w-[80%]">

          {filteredQuizzes.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-xl py-12 text-center text-gray-400">
              {searchQuery ? "No assessments match your search." : "No assessments assigned or published at this time."}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredQuizzes.map((quiz, i) => {
                const statusKey = quiz.attempted ? "attempted" : quiz.status;
                const { label, color, bg } = statusConfig[statusKey as keyof typeof statusConfig];
                const canStart = quiz.status === "live" && !quiz.attempted;

                return (
                  <motion.div
                    key={quiz.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col hover:shadow-sm transition-shadow"
                  >
                    {/* Status badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${bg} ${color}`}>
                        {label}
                      </span>
                      {quiz.attempted && quiz.score !== undefined && (
                        <span className="text-xs text-gray-500">
                          Score: <span className="font-medium text-black">{quiz.score}/{quiz.totalMarks}</span>
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-sm font-semibold text-black leading-snug mb-1.5">{quiz.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-1">{quiz.description}</p>

                    {/* Meta */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock size={12} /> {quiz.durationInMinutes} min
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <HelpCircle size={12} /> {quiz.totalMarks} marks
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar size={12} /> Ends {new Date(quiz.endDate).toLocaleDateString()}
                      </div>
                    </div>

                    {/* CTA */}
                    <button
                      disabled={!canStart}
                      onClick={() => canStart && router.push(`/quiz/${quiz.id}/instructions`)}
                      className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        canStart
                          ? "bg-black text-white hover:bg-gray-900"
                          : "bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-100"
                      }`}
                    >
                      {quiz.attempted ? (
                        <><CheckCircle2 size={14} /> Attempted</>
                      ) : quiz.status === "upcoming" ? (
                        <><Calendar size={14} /> Starts {new Date(quiz.startDate).toLocaleDateString()}</>
                      ) : quiz.status === "closed" ? (
                        <><Lock size={14} /> Closed</>
                      ) : (
                        <>Start Quiz <ChevronRight size={14} /></>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
