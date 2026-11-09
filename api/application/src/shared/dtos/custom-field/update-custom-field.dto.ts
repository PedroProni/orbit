import { ArrayMaxSize, IsArray, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class UpdateCustomFieldDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name?: string;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsArray()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  listIds?: string[] | null;
}
