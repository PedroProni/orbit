import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const toArray = ({ value }: { value: unknown }) => (value === undefined ? undefined : Array.isArray(value) ? value : String(value).split(',').filter(Boolean));
const toBool = ({ value }: { value: unknown }) => value === true || value === 'true';

export class ListTasksQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @IsOptional()
  @IsString()
  listId?: string;

  @IsOptional()
  @IsString()
  spaceId?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  topLevel?: boolean;

  @IsOptional()
  @Transform(toArray)
  statuses?: string[];

  @IsOptional()
  @Transform(toArray)
  assigneeIds?: string[];

  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  unassigned?: boolean;

  @IsOptional()
  @Transform(toArray)
  tags?: string[];

  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Include closed tasks. Defaults to false, or to true when statuses is given. The response echoes the value applied.' })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  includeClosed?: boolean;

  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  includeArchived?: boolean;

  @IsOptional()
  @IsDateString()
  updatedAfter?: string;

  @IsOptional()
  @IsDateString()
  updatedBefore?: string;

  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @IsOptional()
  @IsDateString()
  dueAfter?: string;

  @IsOptional()
  @IsDateString()
  dueBefore?: string;

  @IsOptional()
  @IsIn(['updated_at', 'created_at', 'due_date'])
  orderBy?: 'updated_at' | 'created_at' | 'due_date';

  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  reverse?: boolean;
}
