import { IsEnum } from 'class-validator';
import { UserRole } from '@domain/enums/user.enums';

export class ChangeUserRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}
