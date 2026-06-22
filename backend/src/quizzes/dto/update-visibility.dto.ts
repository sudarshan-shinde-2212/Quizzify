import { IsEnum } from 'class-validator';
import { Visibility } from '../../common/enums/visibility.enum';

export class UpdateVisibilityDto {
  @IsEnum(Visibility)
  visibility: Visibility;
}
