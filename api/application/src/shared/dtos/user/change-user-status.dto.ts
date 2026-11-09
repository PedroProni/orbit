import { IsEnum } from 'class-validator';
import { UserStatus } from '@domain/enums/user.enums';

export class ChangeUserStatusDto {
  @IsEnum(UserStatus)
  status!: UserStatus;
}
