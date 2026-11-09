import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsString, MaxLength, ValidateNested } from 'class-validator';
import { SavedViewWipLimitDto } from '@shared/dtos/saved-view/saved-view-wip-limit.dto';
import { SavedViewCardField, SavedViewGroupBy, SavedViewSortBy, SavedViewSortDirection, SavedViewSwimlane } from '@domain/enums/saved-view.enums';
import { SAVED_VIEW_COLUMN_MAX_LENGTH, SAVED_VIEW_MAX_COLUMNS } from '@domain/constants/saved-view-display.constant';

export class SavedViewDisplayDto {
  @IsEnum(SavedViewGroupBy)
  groupBy!: SavedViewGroupBy;

  @IsEnum(SavedViewSwimlane)
  swimlane!: SavedViewSwimlane;

  @IsEnum(SavedViewSortBy)
  sortBy!: SavedViewSortBy;

  @IsEnum(SavedViewSortDirection)
  sortDirection!: SavedViewSortDirection;

  @IsArray()
  @IsEnum(SavedViewCardField, { each: true })
  cardFields!: SavedViewCardField[];

  @IsBoolean()
  hideEmpty!: boolean;

  @IsArray()
  @ArrayMaxSize(SAVED_VIEW_MAX_COLUMNS)
  @IsString({ each: true })
  @MaxLength(SAVED_VIEW_COLUMN_MAX_LENGTH, { each: true })
  collapsedColumns!: string[];

  @IsArray()
  @ArrayMaxSize(SAVED_VIEW_MAX_COLUMNS)
  @ValidateNested({ each: true })
  @Type(() => SavedViewWipLimitDto)
  wipLimits!: SavedViewWipLimitDto[];
}
