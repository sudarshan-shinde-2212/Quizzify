import { IsString, IsNotEmpty, IsInt, Min, Max } from 'class-validator';

export class GenerateAiQuizDto {
  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  difficulty: string;

  @IsInt()
  @Min(1)
  @Max(50)
  questionCount: number;
}
