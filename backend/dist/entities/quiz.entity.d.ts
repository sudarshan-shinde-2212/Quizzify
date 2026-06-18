import { Admin } from './admin.entity';
import { Question } from './question.entity';
import { QuizAttempt } from './quiz-attempt.entity';
export declare class Quiz {
    id: string;
    title: string;
    description: string;
    instructions: string;
    startDate: Date;
    endDate: Date;
    durationInMinutes: number;
    totalMarks: number;
    isPublished: boolean;
    createdBy: Admin;
    createdById: string;
    questions: Question[];
    attempts: QuizAttempt[];
    createdAt: Date;
    updatedAt: Date;
}
