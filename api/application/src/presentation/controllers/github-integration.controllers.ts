import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated } from '@infrastructure/auth/authenticated.decorator';
import { SCOPE_AUDIT_READ } from '@domain/constants/scopes.constant';
import { GithubIntegrationUseCase } from '@application/use-cases/integration/github-integration.use-case';
import { ListGithubDeliveriesQueryDto } from '@shared/dtos/integration/list-github-deliveries-query.dto';

@ApiTags('Integrations')
@Controller('integrations/github')
export class GithubIntegrationController {
  constructor(private readonly github: GithubIntegrationUseCase) {}

  @Get()
  @Authenticated(SCOPE_AUDIT_READ)
  status() {
    return this.github.status();
  }

  @Get('deliveries')
  @Authenticated(SCOPE_AUDIT_READ)
  deliveries(@Query() query: ListGithubDeliveriesQueryDto) {
    return this.github.listDeliveries(query);
  }
}
