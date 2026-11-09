import { IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class TaskLinksDto {
  @IsOptional()
  @ValidateIf((o: TaskLinksDto) => o.figma !== null)
  @IsString()
  @MaxLength(2048)
  figma?: string | null;

  @IsOptional()
  @ValidateIf((o: TaskLinksDto) => o.notion !== null)
  @IsString()
  @MaxLength(2048)
  notion?: string | null;

  @IsOptional()
  @ValidateIf((o: TaskLinksDto) => o.printsFolder !== null)
  @IsString()
  @MaxLength(2048)
  printsFolder?: string | null;
}
