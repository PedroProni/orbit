import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated } from '@infrastructure/auth/authenticated.decorator';
import { GuestReadable } from '@infrastructure/auth/guest-readable.decorator';
import { CurrentPrincipal } from '@infrastructure/auth/current-principal.decorator';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { SCOPE_TASKS_READ, SCOPE_TASKS_WRITE } from '@domain/constants/scopes.constant';
import { GetTaskGithubUseCase } from '@application/use-cases/github/get-task-github.use-case';
import { RefreshTaskGithubUseCase } from '@application/use-cases/github/refresh-task-github.use-case';

@ApiTags('Tasks')
@Controller()
export class TaskGithubController {
  constructor(
    private readonly getGithub: GetTaskGithubUseCase,
    private readonly refreshGithub: RefreshTaskGithubUseCase,
  ) {}

  @Get('tasks/:id/github')
  @GuestReadable()
  @Authenticated(SCOPE_TASKS_READ)
  get(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    return this.getGithub.execute(principal, id);
  }

  @Post('tasks/:id/github/refresh')
  @HttpCode(200)
  @Authenticated(SCOPE_TASKS_WRITE)
  refresh(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    return this.refreshGithub.execute(principal, id);
  }
}
