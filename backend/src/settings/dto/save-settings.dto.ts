import { IsString, IsNotEmpty, IsInt, Min, Max, IsBoolean, MaxLength, IsOptional } from 'class-validator';

export class SaveSettingsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  platformName: string;

  @IsInt()
  @Min(0)
  @Max(10)
  maxTabSwitches: number;

  /**
   * negativeMarking is intentionally optional here.
   * The Settings UI does not expose this toggle — it is managed
   * directly at the quiz/question level. When absent from the request
   * body, the existing DB value is preserved by the service.
   */
  @IsOptional()
  @IsBoolean()
  negativeMarking?: boolean;

  @IsBoolean()
  autoSubmit: boolean;

  @IsBoolean()
  allowRetakes: boolean;

  @IsBoolean()
  questionShuffle: boolean;

  @IsBoolean()
  emailNotifications: boolean;

  @IsBoolean()
  maintenanceMode: boolean;
}
