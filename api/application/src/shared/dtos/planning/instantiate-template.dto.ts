import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class InstantiateTemplateDto {
  @IsString()
  @IsNotEmpty()
  listId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;
}
