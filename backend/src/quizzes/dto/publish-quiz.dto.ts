import { IsBoolean } from 'class-validator';

export class PublishQuizDto {
  @IsBoolean()
  isPublished: boolean;
}
