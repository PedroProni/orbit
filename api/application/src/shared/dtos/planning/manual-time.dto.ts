import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ManualTimeDto {
  @IsInt()
  @Min(1)
  @Max(1440)
  minutes!: number;

  @IsOptional()
  @IsDateString()
  startedAt?: string;
}
