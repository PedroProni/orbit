import { UserEntity } from '@domain/entities/user.entity';
import { UserRole } from '@domain/enums/user.enums';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface UserRepository extends BaseRepository<UserEntity> {
  changeRoleIfCurrent(id: string, workspaceId: string, current: UserRole, next: UserRole): Promise<UserEntity | null>;
}
