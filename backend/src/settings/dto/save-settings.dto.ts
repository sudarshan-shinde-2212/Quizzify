import { IsString, IsNotEmpty, IsInt, Min, Max, IsBoolean, MaxLength } from 'class-validator';

export class SaveSettingsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  platformName: string;

  @IsInt()
  @Min(1)
  @Max(10)
  maxTabSwitches: number;

  @IsBoolean()
  negativeMarking: boolean;

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
