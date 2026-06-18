import { Repository } from 'typeorm';
import { QuizResult } from '../entities/quiz-result.entity';
export declare class ResultsService {
    private resultRepo;
    constructor(resultRepo: Repository<QuizResult>);
    getStudentResults(studentId: string): Promise<QuizResult[]>;
    getStudentResultByQuiz(studentId: string, quizId: string): Promise<QuizResult>;
    getAllResults(): Promise<QuizResult[]>;
    getResultsByQuiz(quizId: string): Promise<QuizResult[]>;
    getResultsByStudent(studentId: string): Promise<QuizResult[]>;
}
