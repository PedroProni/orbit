import { IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class CustomFieldValueDto {
  @IsString()
  @IsNotEmpty()
  fieldId!: string;

  @ValidateIf((o) => o.value !== null)
  value!: string | number | null;
}
