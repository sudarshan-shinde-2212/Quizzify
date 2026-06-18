import { QuizAttempt } from './quiz-attempt.entity';
import { Student } from './student.entity';
import { Quiz } from './quiz.entity';
export declare class QuizResult {
    id: string;
    attempt: QuizAttempt;
    attemptId: string;
    student: Student;
    studentId: string;
    quiz: Quiz;
    quizId: string;
    totalQuestions: number;
    attemptedQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    score: number;
    percentage: number;
    createdAt: Date;
}
