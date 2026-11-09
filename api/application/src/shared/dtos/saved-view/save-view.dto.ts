import { Type } from 'class-transformer';
import { IsBoolean, IsDefined, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { SavedViewType } from '@domain/enums/saved-view.enums';
import { SavedViewFiltersDto } from '@shared/dtos/saved-view/saved-view-filters.dto';
import { SavedViewDisplayDto } from '@shared/dtos/saved-view/saved-view-display.dto';

export class SaveViewDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @IsEnum(SavedViewType)
  viewType!: SavedViewType;

  @IsOptional()
  @IsString()
  listId?: string | null;

  @IsDefined()
  @ValidateNested()
  @Type(() => SavedViewFiltersDto)
  filters!: SavedViewFiltersDto;

  @IsOptional()
  @IsBoolean()
  shared?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => SavedViewDisplayDto)
  display?: SavedViewDisplayDto | null;
}
