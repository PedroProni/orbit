import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SaveDocDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @MaxLength(200000)
  bodyMd!: string;

  @IsOptional()
  @IsString()
  spaceId?: string | null;

  @IsOptional()
  @IsString()
  parentId?: string | null;
}
