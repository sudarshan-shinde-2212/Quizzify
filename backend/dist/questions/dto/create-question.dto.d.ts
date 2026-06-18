import { CorrectOption } from '../../common/enums/option.enum';
export declare class CreateQuestionDto {
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: CorrectOption;
    marks: number;
    negativeMarks?: number;
}
