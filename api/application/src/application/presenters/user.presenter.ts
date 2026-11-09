import { UserEntity } from '@domain/entities/user.entity';

export class UserPresenter {
  static toView(user: UserEntity) {
    return { id: user.getId(), workspaceId: user.getWorkspaceId(), email: user.getEmail(), name: user.getName(), avatarUrl: user.getAvatarUrl(), role: user.getRole(), status: user.getStatus() };
  }
}
