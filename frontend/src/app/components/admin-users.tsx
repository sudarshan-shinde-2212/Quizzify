import { useEffect, useState } from "react";
import { AdminLayout } from "./admin-sidebar";
import { apiAdminGetStudents, apiAdminGetResults, StoredUser, QuizResult } from "./api";
import { motion } from "motion/react";
import { Search, Trophy, Calendar, Loader2 } from "lucide-react";

interface EnrichedStudent extends StoredUser {
  attempts: number;
  avgScore: number;
}

function formatJoinedDate(createdAt?: string) {
  if (!createdAt) return "Unknown";

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleDateString();
}

export function AdminUsers() {
  const [students, setStudents] = useState<EnrichedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [studentsData, resultsData] = await Promise.all([
          apiAdminGetStudents(),
          apiAdminGetResults(),
        ]);

        const enriched = studentsData.map((student) => {
          const studentResults = resultsData.filter((r) => r.studentId === student.id);
          const attempts = studentResults.length;
          const avgScore =
            attempts > 0
              ? Math.round(studentResults.reduce((sum, r) => sum + Number(r.percentage), 0) / attempts)
              : 0;

          return {
            ...student,
            attempts,
            avgScore,
          };
        });

        setStudents(enriched);
      } catch (err) {
        console.error("Failed to load users analytics", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = students.filter(
    (u) =>
      (u.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.collegeName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-black">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">{students.length} registered students</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-black"
          placeholder="Search students, emails, colleges..."
        />
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-black mb-2" size={24} />
          <p className="text-sm text-gray-500">Loading student list…</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  {["User", "Email", "College / Department", "Attempts", "Avg Score", "Joined"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, i) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                          {(user.fullName || "S")[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-black">{user.fullName || "Student"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{user.email}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {user.collegeName ? (
                        <div>
                          <p className="font-medium text-gray-700">{user.collegeName}</p>
                          <p className="text-xs text-gray-400">{user.department} &bull; Year {user.yearOfStudy}</p>
                        </div>
                      ) : (
                        <span className="text-gray-300 italic">Profile Incomplete</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-700 font-semibold">{user.attempts}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-gray-700 font-semibold">{user.avgScore}%</span>
                        <Trophy size={11} className="text-gray-300" />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={11} />
                        {formatJoinedDate(user.createdAt)}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400">No users found matching "{search}"</div>
            )}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((user, i) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white border border-gray-100 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
                      {(user.fullName || "S")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-black">{user.fullName || "Student"}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                </div>
                {user.collegeName && (
                  <p className="text-xs text-gray-500 mb-2">
                    {user.collegeName} ({user.department})
                  </p>
                )}
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>Attempts: <span className="font-semibold text-black">{user.attempts}</span></span>
                  <span>Avg: <span className="font-semibold text-black">{user.avgScore}%</span></span>
                  <span>Joined: {formatJoinedDate(user.createdAt)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
