import {
  IsString, IsNotEmpty, IsOptional, IsDateString,
  IsInt, Min, IsNumber, IsBoolean,
} from 'class-validator';

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

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsInt()
  @Min(1)
  durationInMinutes: number;

  @IsNumber()
  @Min(0)
  totalMarks: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
