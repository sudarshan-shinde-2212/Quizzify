// ---------------------------------------------------------------------------
// API service — all backend communication goes through here
// Base URL is resolved via Next.js rewrites (/api → backend)
// In production set NEXT_PUBLIC_API_BASE_URL to your deployed backend URL
// ---------------------------------------------------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

// ── Session & Storage Keys ───────────────────────────────────────────────────

const TOKEN_KEY = 'quizzify_token';
const ROLE_KEY = 'quizzify_role';
const USER_KEY = 'quizzify_user';

export function saveSession(token: string, role: string, user: StoredUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredRole(): string | null {
  return localStorage.getItem(ROLE_KEY);
}

export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as StoredUser; } catch { return null; }
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

// ── Shared Types ─────────────────────────────────────────────────────────────

export interface StoredUser {
  id: string;
  email: string;
  fullName: string;
  name?: string;
  avatar?: string;
  role: 'student' | 'admin';
  profileCompleted?: boolean;
  phoneNumber?: string;
  collegeName?: string;
  department?: string;
  yearOfStudy?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  startDate: string;
  endDate: string;
  durationInMinutes: number;
  totalMarks: number;
  questionCount: number;
  negativeMarks: number;
  isPublished: boolean;
  visibility: 'public' | 'private';
  createdById: string;
  createdAt: string;
  updatedAt: string;
  allowRetakes: boolean;
  maxRetakes: number;
  passingScore: number;
  shuffleQuestions: boolean;
  questions?: Question[];
}

export interface Question {
  id: string;
  quizId: string;
  text: string;
  imageUrl?: string | null;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption?: 'A' | 'B' | 'C' | 'D';
  marks: number;
  negativeMarks?: number;
  difficulty?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttempt {
  id: string;
  studentId: string;
  quizId: string;
  startedAt: string;
  submittedAt: string | null;
  isSubmitted: boolean;
}

export interface QuizResult {
  id: string;
  attemptId: string;
  studentId: string;
  quizId: string;
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  score: number | null;
  percentage: number | null;
  cheatingDetected: boolean;
  createdAt: string;
  quiz?: Quiz;
  student?: StoredUser;
}

export interface AdminLoginResponse {
  accessToken: string;
  role: 'admin';
}

export interface GoogleLoginResponse {
  accessToken: string;
  role: 'student';
  profileCompleted: boolean;
}

// New types for features
export interface UserDetailsResponse {
  student: StoredUser;
  stats: {
    totalQuizzesAttempted: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    lastActivity: string;
  };
}

export interface UserHistoryItem {
  quizName: string;
  dateAttempted: string;
  score: number | null;
  percentage: number | null;
  correctAnswers: number;
  wrongAnswers: number;
  status: 'Pass' | 'Fail' | 'Cheating Detected';
}

export interface QuizStats {
  overview: {
    quizName: string;
    totalQuestions: number;
    publishedStatus: boolean;
    creationDate: string;
  };
  participation: {
    totalStudentsAttempted: number;
    totalAttempts: number;
    completionRate: number;
  };
  performance: {
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passCount: number;
    failCount: number;
    passPercentage: number;
  };
}

export interface QuizResultsItem {
  studentName: string;
  email: string;
  score: number;
  percentage: number;
  attemptDate: string;
}

export interface LeaderboardEntry {
  rank: number;
  studentName: string;
  score: number | null;
  percentage: number | null;
  attemptDate: string;
  completionTimeSeconds: number | null;
}

export interface LeaderboardResponse {
  publicQuizzes: Array<{ id: string; title: string }>;
  currentQuizId: string | null;
  currentQuizTitle: string | null;
  leaderboard: LeaderboardEntry[];
}

// ── HTTP helper ──────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  retries = 2
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

    if (!res.ok) {
      if (res.status >= 500 && retries > 0) {
        // Wait 1.5 seconds and retry (helps with Render cold starts)
        await new Promise(resolve => setTimeout(resolve, 1500));
        return request<T>(path, options, retries - 1);
      }

      let message = `Request failed: ${res.status}`;
      try {
        const body = await res.json();
        message = body?.message ?? message;
      } catch { /* ignore */ }
      throw new Error(message);
    }

    const text = await res.text();
    if (!text) return undefined as unknown as T;
    try {
      return JSON.parse(text) as T;
    } catch (e) {
      return text as unknown as T;
    }
  } catch (error) {
    if (error instanceof TypeError && retries > 0) {
      // Network errors (like connection refused during cold start)
      await new Promise(resolve => setTimeout(resolve, 2000));
      return request<T>(path, options, retries - 1);
    }
    throw error;
  }
}

// ── Auth & Profile Endpoints ─────────────────────────────────────────────────

export async function apiAdminLogin(
  email: string,
  password: string,
): Promise<AdminLoginResponse> {
  return request<AdminLoginResponse>('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function startGoogleOAuth() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  
  const url = new URL(`${backendUrl}/auth/google`);
  if (origin) {
    url.searchParams.set('state', origin);
  }
  
  window.location.href = url.toString();
}

export function parseOAuthCallback(): {
  token: string;
  role: string;
  profileCompleted: boolean;
} | null {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const role = params.get('role');
  if (!token || !role) return null;
  const profileCompleted = params.get('profileCompleted') === 'true';
  window.history.replaceState({}, '', window.location.pathname);
  return { token, role, profileCompleted };
}

export async function apiGetProfile(): Promise<StoredUser> {
  return request<StoredUser>('/students/me');
}

export async function apiCompleteProfile(data: {
  fullName: string;
  phoneNumber: string;
  collegeName: string;
  department: string;
  yearOfStudy: number;
}): Promise<StoredUser> {
  return request<StoredUser>('/students/profile', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── Student Portal Endpoints ─────────────────────────────────────────────────

export async function apiGetStudentQuizzes(): Promise<Quiz[]> {
  return request<Quiz[]>('/student/quizzes');
}

export async function apiGetStudentQuiz(id: string): Promise<Quiz> {
  return request<Quiz>(`/student/quizzes/${id}`);
}

export async function apiStartQuizAttempt(quizId: string): Promise<QuizAttempt> {
  return request<QuizAttempt>(`/student/quizzes/${quizId}/start`, {
    method: 'POST',
  });
}

export async function apiSubmitQuizAttempt(
  quizId: string,
  answers: { questionId: string; selectedOption: 'A' | 'B' | 'C' | 'D' }[],
  cheatingDetected: boolean = false,
): Promise<{
  score: number | null;
  percentage: number | null;
  correctAnswers: number;
  wrongAnswers: number;
  totalQuestions: number;
  cheatingDetected?: boolean;
}> {
  return request(`/student/quizzes/${quizId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers, cheatingDetected }),
  });
}

export async function apiGetStudentResults(): Promise<QuizResult[]> {
  return request<QuizResult[]>('/student/results');
}

// ── Admin Portal Quizzes CRUD ────────────────────────────────────────────────

export async function apiAdminGetQuizzes(): Promise<Quiz[]> {
  return request<Quiz[]>('/admin/quizzes');
}

export async function apiAdminSearchQuizzes(query: string): Promise<Quiz[]> {
  return request<Quiz[]>(`/admin/quizzes/search?q=${encodeURIComponent(query)}`);
}

export async function apiAdminCreateQuiz(data: {
  title: string;
  description: string;
  instructions: string;
  startDate: string;
  endDate: string;
  durationInMinutes: number;
  totalMarks: number;
  questionCount: number;
  negativeMarks?: number;
  isPublished?: boolean;
  visibility?: 'public' | 'private';
}): Promise<Quiz> {
  return request<Quiz>('/admin/quizzes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiAdminUpdateQuiz(
  id: string,
  data: Partial<Quiz>,
): Promise<Quiz> {
  return request<Quiz>(`/admin/quizzes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function apiAdminDeleteQuiz(id: string): Promise<void> {
  return request<void>(`/admin/quizzes/${id}`, {
    method: 'DELETE',
  });
}

export async function apiAdminPublishQuiz(
  id: string,
  isPublished: boolean,
): Promise<Quiz> {
  return request<Quiz>(`/admin/quizzes/${id}/publish`, {
    method: 'PATCH',
    body: JSON.stringify({ isPublished }),
  });
}

export async function apiAdminUpdateQuizVisibility(
  id: string,
  visibility: 'public' | 'private',
): Promise<Quiz> {
  return request<Quiz>(`/admin/quizzes/${id}/visibility`, {
    method: 'PATCH',
    body: JSON.stringify({ visibility }),
  });
}

export interface QuizSettings {
  allowRetakes: boolean;
  maxRetakes: number;
  passingScore: number;
  shuffleQuestions: boolean;
}

export async function apiAdminGetQuizSettings(quizId: string): Promise<QuizSettings> {
  return request<QuizSettings>(`/admin/quizzes/${quizId}/settings`);
}

export async function apiAdminUpdateQuizSettings(
  quizId: string,
  settings: Partial<QuizSettings>,
): Promise<QuizSettings> {
  return request<QuizSettings>(`/admin/quizzes/${quizId}/settings`, {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
}

export interface GlobalSearchResult {
  users: Array<{
    id: string;
    name: string;
    email: string;
    username?: string;
  }>;
  quizzes: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
  questions: Array<{
    id: string;
    quizId: string;
    text: string;
  }>;
}

export async function apiAdminGlobalSearch(query: string): Promise<GlobalSearchResult> {
  return request<GlobalSearchResult>(`/admin/search?q=${encodeURIComponent(query)}`);
}

export async function apiGetLeaderboard(quizId?: string): Promise<LeaderboardResponse> {
  const url = quizId ? `/leaderboard/public/${quizId}` : '/leaderboard/public';
  return request<LeaderboardResponse>(url);
}

// New quiz endpoints
export async function apiAdminGetQuizStats(quizId: string): Promise<QuizStats> {
  return request<QuizStats>(`/admin/quizzes/${quizId}/stats`);
}

export async function apiAdminGetQuizResults(
  quizId: string,
  options?: { q?: string; sortBy?: 'date' | 'score'; sortOrder?: 'ASC' | 'DESC' },
): Promise<QuizResultsItem[]> {
  let url = `/admin/quizzes/${quizId}/results`;
  const params = new URLSearchParams();
  if (options?.q) params.set('q', options.q);
  if (options?.sortBy) params.set('sortBy', options.sortBy);
  if (options?.sortOrder) params.set('sortOrder', options.sortOrder);
  if (params.toString()) url += `?${params.toString()}`;
  return request<QuizResultsItem[]>(url);
}

// ── Admin Portal Questions CRUD ──────────────────────────────────────────────

export async function apiAdminGetQuestions(quizId: string): Promise<Question[]> {
  return request<Question[]>(`/admin/quizzes/${quizId}/questions`);
}

export async function apiAdminSearchQuestions(query: string): Promise<Question[]> {
  return request<Question[]>(`/admin/questions/search?q=${encodeURIComponent(query)}`);
}

export async function apiAdminCreateQuestion(
  quizId: string,
  data: {
    text: string;
    imageUrl?: string | null;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: 'A' | 'B' | 'C' | 'D';
    marks: number;
    negativeMarks?: number;
    difficulty?: string;
  },
): Promise<Question> {
  return request<Question>(`/admin/quizzes/${quizId}/questions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiAdminBulkCreateQuestions(
  quizId: string,
  questions: Array<{
    text: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: 'A' | 'B' | 'C' | 'D';
    marks: number;
    negativeMarks?: number;
    difficulty?: string;
  }>,
): Promise<Question[]> {
  return request<Question[]>(`/admin/quizzes/${quizId}/questions/bulk`, {
    method: 'POST',
    body: JSON.stringify({ questions }),
  });
}

export async function apiAdminUpdateQuestion(
  id: string,
  data: Partial<Question>,
): Promise<Question> {
  return request<Question>(`/admin/questions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function apiAdminDeleteQuestion(id: string): Promise<void> {
  return request<void>(`/admin/questions/${id}`, {
    method: 'DELETE',
  });
}

// ── Admin Analytics & Users Endpoints ────────────────────────────────────────

export async function apiAdminGetResults(): Promise<QuizResult[]> {
  return request<QuizResult[]>('/admin/results');
}

export async function apiAdminGetUsers(): Promise<StoredUser[]> {
  return request<StoredUser[]>('/admin/users');
}

/** Alias for apiAdminGetUsers for backward compatibility */
export const apiAdminGetStudents = apiAdminGetUsers;

export async function apiAdminSearchUsers(query: string): Promise<StoredUser[]> {
  return request<StoredUser[]>(`/admin/users/search?q=${encodeURIComponent(query)}`);
}

export async function apiAdminGetUserDetails(userId: string): Promise<UserDetailsResponse> {
  return request<UserDetailsResponse>(`/admin/users/${userId}`);
}

export async function apiAdminGetUserHistory(
  userId: string,
  options?: { q?: string; sortBy?: 'date' | 'score'; sortOrder?: 'ASC' | 'DESC' },
): Promise<UserHistoryItem[]> {
  let url = `/admin/users/${userId}/history`;
  const params = new URLSearchParams();
  if (options?.q) params.set('q', options.q);
  if (options?.sortBy) params.set('sortBy', options.sortBy);
  if (options?.sortOrder) params.set('sortOrder', options.sortOrder);
  if (params.toString()) url += `?${params.toString()}`;
  return request<UserHistoryItem[]>(url);
}

export async function apiAdminAiChat(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
): Promise<{ response: string }> {
  return request<{ response: string }>('/admin/ai-chat', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  });
}

export async function apiAdminGenerateAiQuiz(data: {
  topic: string;
  category: string;
  difficulty: string;
  questionCount: number;
}): Promise<any> {
  return request<any>('/admin/ai-quiz/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiAdminGenerateAiImage(prompt: string): Promise<{ imageUrl: string }> {
  return request<{ imageUrl: string }>('/admin/ai-image/generate', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });
}

export async function apiAdminSaveAiQuiz(data: any): Promise<any> {
  return request<any>('/admin/ai-quiz/save', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── Settings Endpoints ───────────────────────────────────────────────────────

export async function apiGetSettings(): Promise<any> {
  return request<any>('/settings');
}

export async function apiSaveSettings(data: any): Promise<any> {
  return request<any>('/settings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export { request };
