import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AUDIT_LOG_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { KEYSET_DEFAULT_LIMIT } from '@domain/constants/keyset-cursor.constant';
import { AuditLogRepository } from '@domain/repositories/audit-log.repository';
import { AuditLogFilterPolicy } from '@domain/policies/audit-log-filter.policy';
import { KeysetCursorPolicy } from '@domain/policies/keyset-cursor.policy';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { AuditLogFilter } from '@domain/types/audit-log-filter.type';
import { AuditLogView } from '@domain/types/audit-log-view.type';
import { KeysetView } from '@domain/types/keyset-view.type';
import { AuditReferenceService } from '@application/services/audit-reference.service';
import { AuditLogPresenter } from '@application/presenters/audit-log.presenter';
import { ListAuditLogsQueryDto } from '@shared/dtos/audit/list-audit-logs-query.dto';

@Injectable()
export class ListAuditLogsUseCase {
  constructor(
    @Inject(AUDIT_LOG_INJECT_TOKEN) private readonly logs: AuditLogRepository,
    private readonly references: AuditReferenceService,
  ) {}

  async execute(principal: AuthPrincipal, query: ListAuditLogsQueryDto): Promise<KeysetView<AuditLogView>> {
    const filter: AuditLogFilter = { actorId: query.actorId, action: query.action, entityType: query.entityType, entityId: query.entityId, from: query.from ? new Date(query.from) : undefined, to: query.to ? new Date(query.to) : undefined };
    if (!AuditLogFilterPolicy.isRangeValid(filter)) throw new BadRequestException('from must not be after to');
    const after = query.cursor ? KeysetCursorPolicy.decode(query.cursor) : null;
    if (query.cursor && !after) throw new BadRequestException('Invalid cursor');
    const page = await this.logs.findKeyset(AuditLogFilterPolicy.toQuery(principal.workspaceId, filter), after, query.limit ?? KEYSET_DEFAULT_LIMIT);
    const references = await this.references.resolve(principal, page.items);
    return { items: page.items.map((log) => AuditLogPresenter.toView(log, references)), nextCursor: page.next ? KeysetCursorPolicy.encode(page.next) : null };
  }
}
