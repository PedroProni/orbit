import { IsArray, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  bodyMd!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentionIds?: string[];
}
