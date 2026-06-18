// ---------------------------------------------------------------------------
// API service — all backend communication goes through here
// Base URL is resolved via Vite dev proxy (/api → http://localhost:3000)
// In production set VITE_API_BASE_URL to your deployed backend URL
// ---------------------------------------------------------------------------

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

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
  isPublished: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  questions?: Question[];
}

export interface Question {
  id: string;
  quizId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption?: 'A' | 'B' | 'C' | 'D'; // optional for students
  marks: number;
  negativeMarks: number;
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
  score: number;
  percentage: number;
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

// ── HTTP helper ──────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      message = body?.message ?? message;
    } catch { /* ignore */ }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
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
  window.location.href = `${BASE_URL}/auth/google`;
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
): Promise<{
  score: number;
  percentage: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalQuestions: number;
}> {
  return request(`/student/quizzes/${quizId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

export async function apiGetStudentResults(): Promise<QuizResult[]> {
  return request<QuizResult[]>('/student/results');
}

// ── Admin Portal Quizzes CRUD ────────────────────────────────────────────────

export async function apiAdminGetQuizzes(): Promise<Quiz[]> {
  return request<Quiz[]>('/admin/quizzes');
}

export async function apiAdminCreateQuiz(data: {
  title: string;
  description: string;
  instructions: string;
  startDate: string;
  endDate: string;
  durationInMinutes: number;
  totalMarks: number;
  isPublished?: boolean;
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

// ── Admin Portal Questions CRUD ──────────────────────────────────────────────

export async function apiAdminGetQuestions(quizId: string): Promise<Question[]> {
  return request<Question[]>(`/admin/quizzes/${quizId}/questions`);
}

export async function apiAdminCreateQuestion(
  quizId: string,
  data: {
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: 'A' | 'B' | 'C' | 'D';
    marks: number;
    negativeMarks?: number;
  },
): Promise<Question> {
  return request<Question>(`/admin/quizzes/${quizId}/questions`, {
    method: 'POST',
    body: JSON.stringify(data),
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

export async function apiAdminGetStudents(): Promise<StoredUser[]> {
  return request<StoredUser[]>('/students/admin/list');
}

export { request };
