import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AccessLinkTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  token!: string;
}
