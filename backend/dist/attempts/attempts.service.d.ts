import { Repository } from 'typeorm';
import { QuizAttempt } from '../entities/quiz-attempt.entity';
import { QuizAnswer } from '../entities/quiz-answer.entity';
import { QuizResult } from '../entities/quiz-result.entity';
import { Question } from '../entities/question.entity';
import { QuizzesService } from '../quizzes/quizzes.service';
import { SubmitAnswersDto } from './dto/submit-answers.dto';
export declare class AttemptsService {
    private attemptRepo;
    private answerRepo;
    private resultRepo;
    private questionRepo;
    private quizzesService;
    constructor(attemptRepo: Repository<QuizAttempt>, answerRepo: Repository<QuizAnswer>, resultRepo: Repository<QuizResult>, questionRepo: Repository<Question>, quizzesService: QuizzesService);
    startQuiz(studentId: string, quizId: string): Promise<QuizAttempt>;
    submitQuiz(studentId: string, quizId: string, dto: SubmitAnswersDto): Promise<{
        score: number;
        percentage: number;
        correctAnswers: number;
        wrongAnswers: number;
        totalQuestions: number;
    }>;
}
