import { Quiz } from './quiz.entity';
import { CorrectOption } from '../common/enums/option.enum';
export declare class Question {
    id: string;
    quiz: Quiz;
    quizId: string;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: CorrectOption;
    marks: number;
    negativeMarks: number;
    createdAt: Date;
    updatedAt: Date;
}
