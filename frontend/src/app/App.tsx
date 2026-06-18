import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider, useAuth } from "./components/auth-context";
import { LoginPage } from "./components/login-page";
import { AdminLoginPage } from "./components/admin-login-page";
import { Dashboard } from "./components/dashboard";
import { InstructionsPage } from "./components/instructions-page";
import { QuizPage } from "./components/quiz-page";
import { ResultsPage } from "./components/results-page";
import { HistoryPage } from "./components/history-page";
import { ProfilePage } from "./components/profile-page";
import { AdminDashboard } from "./components/admin-dashboard";
import { AdminQuizzes } from "./components/admin-quizzes";
import { AdminQuestions } from "./components/admin-questions";
import { AdminUsers } from "./components/admin-users";
import { AdminResults } from "./components/admin-results";
import { AdminAnalytics } from "./components/admin-analytics";
import { AdminSettings } from "./components/admin-settings";
import { ReactNode } from "react";

/* MARKER-MAKE-KIT-INVOKED */

// ── Loading spinner shown while session is being restored ────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    </div>
  );
}

// ── Route guards ─────────────────────────────────────────────────────────────

function UserGuard({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user || isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AdminGuard({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

function AuthRedirect() {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user && isAdmin) return <Navigate to="/admin" replace />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <LoginPage />;
}

// ── Routes ───────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AuthRedirect />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />

      <Route path="/dashboard" element={<UserGuard><Dashboard /></UserGuard>} />
      <Route path="/quiz/:quizId/instructions" element={<UserGuard><InstructionsPage /></UserGuard>} />
      <Route path="/quiz/:quizId" element={<UserGuard><QuizPage /></UserGuard>} />
      <Route path="/results" element={<UserGuard><ResultsPage /></UserGuard>} />
      <Route path="/history" element={<UserGuard><HistoryPage /></UserGuard>} />
      <Route path="/profile" element={<UserGuard><ProfilePage /></UserGuard>} />

      <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
      <Route path="/admin/quizzes" element={<AdminGuard><AdminQuizzes /></AdminGuard>} />
      <Route path="/admin/questions" element={<AdminGuard><AdminQuestions /></AdminGuard>} />
      <Route path="/admin/users" element={<AdminGuard><AdminUsers /></AdminGuard>} />
      <Route path="/admin/results" element={<AdminGuard><AdminResults /></AdminGuard>} />
      <Route path="/admin/analytics" element={<AdminGuard><AdminAnalytics /></AdminGuard>} />
      <Route path="/admin/settings" element={<AdminGuard><AdminSettings /></AdminGuard>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
