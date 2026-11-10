import { UserEntity } from '@domain/entities/user.entity';
import { UserStatus } from '@domain/enums/user.enums';
import { FORM_PAUSED_CREATOR_ROLES } from '@domain/constants/public-form.constant';

export class FormOwnerPolicy {
  static canAct(owner: UserEntity | null): owner is UserEntity {
    return !!owner && owner.getStatus() === UserStatus.ACTIVE && !FORM_PAUSED_CREATOR_ROLES.includes(owner.getRole());
  }
}
