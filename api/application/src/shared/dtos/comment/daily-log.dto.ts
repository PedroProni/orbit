import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class DailyLogDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  bodyMd!: string;
}
