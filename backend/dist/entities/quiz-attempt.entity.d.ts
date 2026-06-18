import { Student } from './student.entity';
import { Quiz } from './quiz.entity';
import { QuizAnswer } from './quiz-answer.entity';
import { QuizResult } from './quiz-result.entity';
export declare class QuizAttempt {
    id: string;
    student: Student;
    studentId: string;
    quiz: Quiz;
    quizId: string;
    startedAt: Date;
    submittedAt: Date;
    isSubmitted: boolean;
    answers: QuizAnswer[];
    results: QuizResult[];
    createdAt: Date;
}
