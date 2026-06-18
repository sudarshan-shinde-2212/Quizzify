import { AttemptsService } from './attempts.service';
import { SubmitAnswersDto } from './dto/submit-answers.dto';
export declare class AttemptsController {
    private attemptsService;
    constructor(attemptsService: AttemptsService);
    start(quizId: string, user: any): Promise<import("../entities/quiz-attempt.entity").QuizAttempt>;
    submit(quizId: string, user: any, dto: SubmitAnswersDto): Promise<{
        score: number;
        percentage: number;
        correctAnswers: number;
        wrongAnswers: number;
        totalQuestions: number;
    }>;
}
