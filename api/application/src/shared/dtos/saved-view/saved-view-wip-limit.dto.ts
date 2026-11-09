import { IsInt, IsString, Max, MaxLength, Min } from 'class-validator';
import { SAVED_VIEW_COLUMN_MAX_LENGTH, SAVED_VIEW_WIP_MAX } from '@domain/constants/saved-view-display.constant';

export class SavedViewWipLimitDto {
  @IsString()
  @MaxLength(SAVED_VIEW_COLUMN_MAX_LENGTH)
  column!: string;

  @IsInt()
  @Min(1)
  @Max(SAVED_VIEW_WIP_MAX)
  limit!: number;
}
