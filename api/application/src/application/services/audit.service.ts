import { Inject, Injectable } from '@nestjs/common';
import { AUDIT_LOG_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { AuditLogRepository } from '@domain/repositories/audit-log.repository';
import { AuditLogEntity } from '@domain/entities/audit-log.entity';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { newId } from '@common/helpers/functions/id.helper';

@Injectable()
export class AuditService {
  constructor(@Inject(AUDIT_LOG_INJECT_TOKEN) private readonly repo: AuditLogRepository) {}

  async record(principal: AuthPrincipal, action: string, entityType: string, entityId: string, meta: Record<string, unknown> = {}): Promise<void> {
    const now = new Date();
    await this.repo.create(new AuditLogEntity({ _id: newId(), workspaceId: principal.workspaceId, actorType: principal.actorType, actorId: principal.actorId, action, entityType, entityId, meta, createdAt: now, updatedAt: now }));
  }
}
