import { QuizAttempt } from './quiz-attempt.entity';
import { Question } from './question.entity';
import { CorrectOption } from '../common/enums/option.enum';
export declare class QuizAnswer {
    id: string;
    attempt: QuizAttempt;
    attemptId: string;
    question: Question;
    questionId: string;
    selectedOption: CorrectOption;
    createdAt: Date;
}
