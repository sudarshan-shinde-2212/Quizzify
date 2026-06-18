import {
  IsString, IsNotEmpty, IsEnum, IsNumber, Min, IsOptional,
} from 'class-validator';
import { CorrectOption } from '../../common/enums/option.enum';

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @IsString()
  @IsNotEmpty()
  optionA: string;

  @IsString()
  @IsNotEmpty()
  optionB: string;

  @IsString()
  @IsNotEmpty()
  optionC: string;

  @IsString()
  @IsNotEmpty()
  optionD: string;

  @IsEnum(CorrectOption)
  correctOption: CorrectOption;

  @IsNumber()
  @Min(0)
  marks: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  negativeMarks?: number;
}
