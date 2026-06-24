import {
  IsString, IsNotEmpty, IsOptional, IsDateString, IsInt, Min, IsArray, ValidateNested, IsEnum, IsNumber
} from 'class-validator';
import { Type } from 'class-transformer';
import { CorrectOption } from '../../common/enums/option.enum';
import { Visibility } from '../../common/enums/visibility.enum';

export class SaveAiQuizQuestionDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

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

  @IsOptional()
  @IsNumber()
  @Min(0)
  marks?: number;
}

export class SaveAiQuizDto {
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
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  expectedQuestionCount?: number;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveAiQuizQuestionDto)
  questions: SaveAiQuizQuestionDto[];
}
