import { ArrayMaxSize, IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { CustomFieldType } from '@domain/enums/custom-field.enums';

export class CreateCustomFieldDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @IsEnum(CustomFieldType)
  type!: CustomFieldType;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  options?: string[];

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsArray()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  listIds?: string[] | null;
}
