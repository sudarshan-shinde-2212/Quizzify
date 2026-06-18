import { CorrectOption } from '../../common/enums/option.enum';
export declare class AnswerItemDto {
    questionId: string;
    selectedOption: CorrectOption;
}
export declare class SubmitAnswersDto {
    answers: AnswerItemDto[];
}
