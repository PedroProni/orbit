import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { StatusType } from '@domain/enums/space.enums';

export class StatusDefinitionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name!: string;

  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  color!: string;

  @IsEnum(StatusType)
  type!: StatusType;

  @IsOptional()
  @IsInt()
  order?: number;
}
