import {
  IsString, IsNotEmpty, IsOptional, IsDateString,
  IsInt, Min, IsBoolean, IsNumber, IsEnum,
} from 'class-validator';
import { Visibility } from '../../common/enums/visibility.enum';

export class CreateQuizDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsInt()
  @Min(1)
  durationInMinutes: number;

  /** Total marks – stored as DECIMAL(10,2); must be ≥ 1 */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  totalMarks: number;

  /** Number of questions – no fixed maximum, must be ≥ 1 */
  @IsInt()
  @Min(1)
  questionCount: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  negativeMarks?: number;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @IsOptional()
  @IsBoolean()
  allowRetakes?: boolean;

  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;
}
