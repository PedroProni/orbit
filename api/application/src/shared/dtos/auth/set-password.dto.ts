import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { PASSWORD_MAX_LENGTH } from '@domain/constants/auth.constant';

export class SetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  token!: string;

  @IsString()
  @MaxLength(PASSWORD_MAX_LENGTH + 1)
  password!: string;
}
