import { IsString, MaxLength } from 'class-validator';
import { PASSWORD_MAX_LENGTH } from '@domain/constants/auth.constant';

export class ChangePasswordDto {
  @IsString()
  @MaxLength(PASSWORD_MAX_LENGTH)
  currentPassword!: string;

  @IsString()
  @MaxLength(PASSWORD_MAX_LENGTH + 1)
  newPassword!: string;
}
