import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateIf, ValidateNested } from 'class-validator';
import { TaskPriority } from '@domain/enums/task.enums';
import { CustomFieldValueDto } from '@shared/dtos/task/custom-field-value.dto';
import { ChecklistDto } from '@shared/dtos/task/checklist.dto';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  descriptionMd?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @ValidateIf((o) => o.priority !== null)
  @IsEnum(TaskPriority)
  priority?: TaskPriority | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  addTags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removeTags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assigneeIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  addAssigneeIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removeAssigneeIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  watcherIds?: string[];

  @IsOptional()
  @ValidateIf((o) => o.points !== null)
  @IsNumber()
  @Min(0)
  points?: number | null;

  @IsOptional()
  @ValidateIf((o) => o.startDate !== null)
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.dueDate !== null)
  @IsDateString()
  dueDate?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomFieldValueDto)
  customFields?: CustomFieldValueDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistDto)
  checklists?: ChecklistDto[];

  @IsOptional()
  @IsString()
  listId?: string;

  @IsOptional()
  @IsBoolean()
  archived?: boolean;
}
