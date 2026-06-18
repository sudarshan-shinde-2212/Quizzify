import { IsString, IsNotEmpty, IsInt, Min, Max } from 'class-validator';

export class CompleteProfileDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  collegeName: string;

  @IsString()
  @IsNotEmpty()
  department: string;

  @IsInt()
  @Min(1)
  @Max(6)
  yearOfStudy: number;
}
