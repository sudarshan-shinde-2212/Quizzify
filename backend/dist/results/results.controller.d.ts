import { ResultsService } from './results.service';
export declare class ResultsController {
    private resultsService;
    constructor(resultsService: ResultsService);
    getMyResults(user: any): Promise<import("../entities/quiz-result.entity").QuizResult[]>;
    getMyResultByQuiz(user: any, quizId: string): Promise<import("../entities/quiz-result.entity").QuizResult>;
    getAllResults(): Promise<import("../entities/quiz-result.entity").QuizResult[]>;
    getResultsByQuiz(quizId: string): Promise<import("../entities/quiz-result.entity").QuizResult[]>;
    getResultsByStudent(studentId: string): Promise<import("../entities/quiz-result.entity").QuizResult[]>;
}
