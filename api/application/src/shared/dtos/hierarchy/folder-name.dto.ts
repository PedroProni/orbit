import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class FolderNameDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}
