import { IsString, IsNotEmpty, IsInt, Min, Max, IsBoolean, MaxLength, IsOptional } from 'class-validator';

export class SaveSettingsDto {
  /**
   * platformName is optional here.
   * The Settings UI no longer exposes this field — it is read by the Navbar
   * directly from the DB and is preserved via merge-patch in SettingsService.
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  platformName?: string;

  @IsInt()
  @Min(0)
  @Max(10)
  maxTabSwitches: number;

  /**
   * negativeMarking is optional here.
   * Managed at the quiz/question level, not via the Settings UI.
   */
  @IsOptional()
  @IsBoolean()
  negativeMarking?: boolean;

  /**
   * autoSubmit is optional here.
   * The Settings UI no longer exposes this toggle — it is read by quiz-page.tsx
   * and instructions-page.tsx directly from the DB.
   */
  @IsOptional()
  @IsBoolean()
  autoSubmit?: boolean;

  @IsBoolean()
  allowRetakes: boolean;

  @IsBoolean()
  questionShuffle: boolean;

  @IsBoolean()
  emailNotifications: boolean;

  @IsBoolean()
  maintenanceMode: boolean;
}
