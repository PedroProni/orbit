import { IsDateString, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { RecurrenceFrequency } from '@domain/enums/recurrence.enums';

export class SetRecurrenceDto {
  @IsEnum(RecurrenceFrequency)
  frequency!: RecurrenceFrequency;

  @IsInt()
  @Min(1)
  @Max(365)
  interval!: number;

  @IsOptional()
  @IsDateString()
  firstRunAt?: string;
}
