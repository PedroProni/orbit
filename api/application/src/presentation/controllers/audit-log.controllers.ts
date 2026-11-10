import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated } from '@infrastructure/auth/authenticated.decorator';
import { CurrentPrincipal } from '@infrastructure/auth/current-principal.decorator';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { SCOPE_AUDIT_READ } from '@domain/constants/scopes.constant';
import { ListAuditLogsUseCase } from '@application/use-cases/audit/list-audit-logs.use-case';
import { ListAuditLogsQueryDto } from '@shared/dtos/audit/list-audit-logs-query.dto';

@ApiTags('Audit logs')
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly listLogs: ListAuditLogsUseCase) {}

  @Get()
  @Authenticated(SCOPE_AUDIT_READ)
  list(@CurrentPrincipal() principal: AuthPrincipal, @Query() query: ListAuditLogsQueryDto) {
    return this.listLogs.execute(principal, query);
  }
}
