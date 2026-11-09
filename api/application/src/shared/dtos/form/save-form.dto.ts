import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { FormFieldTarget } from '@domain/enums/form.enums';

export class FormFieldDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  label!: string;

  @IsBoolean()
  required!: boolean;

  @IsEnum(FormFieldTarget)
  target!: FormFieldTarget;
}

export class SaveFormDto {
  @IsString()
  @IsNotEmpty()
  listId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => FormFieldDto)
  fields!: FormFieldDto[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
