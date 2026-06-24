import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ViolationType } from '../../entities/quiz-attempt.entity';

export class RecordViolationDto {
  @IsEnum(ViolationType)
  violationType: ViolationType;

  @IsOptional()
  @IsString()
  details?: string;
}
