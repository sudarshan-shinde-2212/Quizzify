import { IsArray, ValidateNested, IsUUID, IsEnum, ArrayMinSize, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { CorrectOption } from '../../common/enums/option.enum';

export class AnswerItemDto {
  @IsUUID()
  questionId: string;

  @IsEnum(CorrectOption)
  selectedOption: CorrectOption;
}

export class SubmitAnswersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDto)
  answers: AnswerItemDto[];

  @IsOptional()
  @IsBoolean()
  cheatingDetected?: boolean;
}
