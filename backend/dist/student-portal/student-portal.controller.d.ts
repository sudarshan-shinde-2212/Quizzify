import { QuizzesService } from '../quizzes/quizzes.service';
import { Question } from '../entities/question.entity';
type PublicQuestion = Omit<Question, 'correctOption'>;
export declare class StudentPortalController {
    private quizzesService;
    constructor(quizzesService: QuizzesService);
    getActiveQuizzes(): Promise<import("../entities/quiz.entity").Quiz[]>;
    getActiveQuiz(id: string): Promise<{
        questions: PublicQuestion[];
        id: string;
        title: string;
        description: string;
        instructions: string;
        startDate: Date;
        endDate: Date;
        durationInMinutes: number;
        totalMarks: number;
        isPublished: boolean;
        createdBy: import("../entities/admin.entity").Admin;
        createdById: string;
        attempts: import("../entities/quiz-attempt.entity").QuizAttempt[];
        createdAt: Date;
        updatedAt: Date;
    }>;
}
export {};
