import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, MaxLength, ValidateIf, ValidateNested } from 'class-validator';

export class ChecklistItemDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MaxLength(500)
  name!: string;

  @IsOptional()
  @IsBoolean()
  resolved?: boolean;

  @IsOptional()
  @ValidateIf((o) => o.assigneeId !== null)
  @IsString()
  assigneeId?: string | null;
}

export class ChecklistDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  items?: ChecklistItemDto[];
}
