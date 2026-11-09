import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { GoalTargetDto } from '@shared/dtos/goal/goal-target.dto';

export class SaveGoalDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsString()
  @MaxLength(5000)
  description!: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => GoalTargetDto)
  targets!: GoalTargetDto[];
}
