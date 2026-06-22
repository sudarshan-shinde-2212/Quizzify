import {
  IsString, IsNotEmpty, IsEnum, IsNumber, Min, IsOptional, Max, Validate,
} from 'class-validator';
import { CorrectOption } from '../../common/enums/option.enum';
import { IsHalfMark } from '../../common/validators/is-half-mark.validator';

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  text: string;

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

  /**
   * Marks must be > 0 and can have up to 2 decimal places.
   * Stored as DECIMAL(5,2).
   */


  @IsNumber({ maxDecimalPlaces: 1 }, { message: 'Marks must be 0.5 or a whole number.' })
  @Min(0.5, { message: 'Question marks must be at least 0.5.' })
  @Validate(IsHalfMark)
  marks: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99.99)
  negativeMarks?: number;
}
