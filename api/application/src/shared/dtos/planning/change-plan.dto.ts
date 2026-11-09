import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { TaskKind } from '@domain/enums/task-kind.enums';

export class ChangePlanDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(600000)
  estimateMinutes?: number | null;

  @IsOptional()
  @IsEnum(TaskKind)
  taskKind?: TaskKind;
}
