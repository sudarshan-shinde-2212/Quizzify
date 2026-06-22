import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateQuizSettingsDto {
  @IsOptional()
  @IsBoolean()
  allowRetakes?: boolean;

  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;
}
