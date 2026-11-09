import { IsArray, IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class SavedViewFiltersDto {
  @IsArray()
  @IsString({ each: true })
  statuses!: string[];

  @IsArray()
  @IsString({ each: true })
  assigneeIds!: string[];

  @IsArray()
  @IsString({ each: true })
  tags!: string[];

  @IsString()
  @MaxLength(200)
  q!: string;

  @IsBoolean()
  includeClosed!: boolean;

  @IsOptional()
  @IsBoolean()
  unassigned?: boolean;
}
