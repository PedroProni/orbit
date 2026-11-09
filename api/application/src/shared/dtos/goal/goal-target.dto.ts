import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { GoalTargetKind } from '@domain/enums/goal.enums';

export class GoalTargetDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsEnum(GoalTargetKind)
  kind!: GoalTargetKind;

  @IsNumber()
  @Min(0)
  targetValue!: number;

  @IsNumber()
  @Min(0)
  currentValue!: number;

  @IsOptional()
  @IsString()
  taskId?: string | null;
}
