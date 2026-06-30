// src/app/types.ts

export interface User {
  id: string;
  avatarUrl: string;
  fullName: string;
  username: string;
  email: string;
  level: number;
  rank: number;
  totalXP: number;
  quizzesPlayed: number;
  avgScore: number;
  accuracy: number; // percentage 0-100
  lastActive: string; // ISO date string
  status: 'active' | 'inactive' | 'blocked';
}

export interface LeaderboardEntry extends User {}

export interface QuizAttempt {
  id: string;
  quizName: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  score: number;
  maxScore: number;
  accuracy: number; // percentage
  timeTaken: number; // seconds
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  negativeMarks?: number;
  result: 'Passed' | 'Failed';
  attemptDate: string; // ISO string
}

export interface UserStatistics {
  totalQuizzes: number;
  totalXP: number;
  avgScore: number;
  accuracy: number;
  timeSpent: number; // seconds
  wins: number;
  xpChangePercent: number;
}

export interface HistoryResponse {
  user: User;
  statistics: UserStatistics;
  attempts: QuizAttempt[];
}

export interface LeaderboardParams {
  search?: string;
  status?: string[];
  sortBy?: keyof LeaderboardEntry;
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface HistoryParams {
  page?: number;
  pageSize?: number;
  sortBy?: keyof QuizAttempt;
  sortDir?: 'asc' | 'desc';
  filters?: Partial<QuizAttempt>;
}
