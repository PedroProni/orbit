import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { DashboardWidgetType } from '@domain/enums/dashboard.enums';

export class DashboardWidgetDto {
  @IsEnum(DashboardWidgetType)
  type!: DashboardWidgetType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  title!: string;

  @IsOptional()
  @IsString()
  listId?: string | null;
}

export class SaveDashboardDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsBoolean()
  shared?: boolean;

  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => DashboardWidgetDto)
  widgets!: DashboardWidgetDto[];
}
