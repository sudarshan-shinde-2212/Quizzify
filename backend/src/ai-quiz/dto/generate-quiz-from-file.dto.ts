
import { IsString, IsNotEmpty, IsInt, Min, Max, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export enum FileType {
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
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

  @IsOptional()
  @IsString()
  language?: string;
}
