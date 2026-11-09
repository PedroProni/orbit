import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { TaskPriority } from '@domain/enums/task.enums';
import { TaskKind } from '@domain/enums/task-kind.enums';

export class SaveTemplateDto {
  @IsString()
  @IsNotEmpty()
  spaceId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  titleTemplate!: string;

  @IsString()
  @MaxLength(20000)
  descriptionMd!: string;

  @IsArray()
  @IsString({ each: true })
  tags!: string[];

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority | null;

  @IsEnum(TaskKind)
  taskKind!: TaskKind;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(600000)
  estimateMinutes?: number | null;
}
