import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated } from '@infrastructure/auth/authenticated.decorator';
import { CurrentPrincipal } from '@infrastructure/auth/current-principal.decorator';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { SCOPE_AUDIT_READ } from '@domain/constants/scopes.constant';
import { WorkspaceSummaryUseCase } from '@application/use-cases/workspace/workspace-summary.use-case';

@ApiTags('Workspace')
@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly summary: WorkspaceSummaryUseCase) {}

  @Get('summary')
  @Authenticated(SCOPE_AUDIT_READ)
  get(@CurrentPrincipal() principal: AuthPrincipal) {
    return this.summary.execute(principal);
  }
}
