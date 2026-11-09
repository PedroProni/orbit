import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { StatusDefinitionDto } from '@shared/dtos/hierarchy/status-definition.dto';

export class UpdateSpaceDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => StatusDefinitionDto)
  statuses?: StatusDefinitionDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredTags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  titlePrefixes?: string[];
}
