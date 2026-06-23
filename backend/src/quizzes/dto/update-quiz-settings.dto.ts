import { IsBoolean, IsOptional, IsInt, Min, ValidateIf, IsNumber, IsPositive } from 'class-validator';

export class UpdateQuizSettingsDto {
  @IsOptional()
  @IsBoolean()
  allowRetakes?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @ValidateIf(o => o.allowRetakes === true, {
    message: 'maxRetakes must be at least 1 when allowRetakes is true'
  })
  @Min(1, {
    message: 'maxRetakes must be at least 1 when allowRetakes is true'
  })
  maxRetakes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  passingScore?: number;

  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;
}
