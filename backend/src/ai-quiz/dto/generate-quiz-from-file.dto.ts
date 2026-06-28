
import { IsString, IsNotEmpty, IsInt, Min, Max, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export enum FileType {
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
}

export enum QuestionType {
  MCQ = 'MCQ',
  TRUE_FALSE = 'True/False',
  FILL_BLANK = 'Fill in the Blanks',
  MIXED = 'Mixed',
}

export class GenerateQuizFromFileDto {
  @IsEnum(FileType)
  @IsNotEmpty()
  fileType: FileType;

  @IsString()
  @IsNotEmpty()
  difficulty: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  questionCount: number;

  @IsEnum(QuestionType)
  @IsNotEmpty()
  questionType: QuestionType;

  @IsOptional()
  @IsString()
  language?: string;
}
