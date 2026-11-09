import { AuditActorType } from '@domain/enums/audit-log.enums';
import { UserRole } from '@domain/enums/user.enums';
import { UserEntity } from '@domain/entities/user.entity';
import { AuthPrincipal } from '@domain/types/auth-principal.type';

export class AuditActorFactory {
  static forUser(user: UserEntity): AuthPrincipal {
    return { workspaceId: user.getWorkspaceId(), actorType: AuditActorType.USER, actorId: user.getId(), userId: user.getId(), role: user.getRole(), scopes: [] };
  }

  static system(workspaceId: string, actorId: string): AuthPrincipal {
    return { workspaceId, actorType: AuditActorType.SYSTEM, actorId, userId: actorId, role: UserRole.GUEST, scopes: [] };
  }
}
