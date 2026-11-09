import { AuditActorType } from '@domain/enums/audit-log.enums';
import { UserRole } from '@domain/enums/user.enums';

export interface AuthPrincipal {
  workspaceId: string;
  actorType: AuditActorType;
  actorId: string;
  userId: string;
  role: UserRole;
  scopes: string[];
  sessionId?: string;
}
