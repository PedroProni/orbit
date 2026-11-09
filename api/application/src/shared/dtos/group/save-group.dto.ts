import { IsArray, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SaveGroupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name!: string;

  @IsArray()
  @IsString({ each: true })
  memberIds!: string[];
}
