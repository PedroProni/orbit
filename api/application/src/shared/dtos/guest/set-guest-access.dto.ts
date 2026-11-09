import { ArrayMaxSize, IsArray, IsString } from 'class-validator';

export class SetGuestAccessDto {
  @IsArray()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  listIds!: string[];
}
