import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated } from '@infrastructure/auth/authenticated.decorator';
import { GuestReadable } from '@infrastructure/auth/guest-readable.decorator';
import { CurrentPrincipal } from '@infrastructure/auth/current-principal.decorator';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { SCOPE_TASKS_READ, SCOPE_TASKS_WRITE } from '@domain/constants/scopes.constant';
import { ListTaskPullRequestsUseCase } from '@application/use-cases/task/list-task-pull-requests.use-case';
import { LinkTaskPullRequestUseCase } from '@application/use-cases/task/link-task-pull-request.use-case';
import { UnlinkTaskPullRequestUseCase } from '@application/use-cases/task/unlink-task-pull-request.use-case';
import { LinkPullRequestDto } from '@shared/dtos/task/link-pull-request.dto';

@ApiTags('Tasks')
@Controller()
export class TaskPullRequestController {
  constructor(
    private readonly listPullRequests: ListTaskPullRequestsUseCase,
    private readonly linkPullRequest: LinkTaskPullRequestUseCase,
    private readonly unlinkPullRequest: UnlinkTaskPullRequestUseCase,
  ) {}

  @Get('tasks/:id/pull-requests')
  @GuestReadable()
  @Authenticated(SCOPE_TASKS_READ)
  list(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    return this.listPullRequests.execute(principal, id);
  }

  @Post('tasks/:id/pull-requests')
  @Authenticated(SCOPE_TASKS_WRITE)
  async link(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Body() dto: LinkPullRequestDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.linkPullRequest.execute(principal, id, dto.url);
    response.status(result.created ? HttpStatus.CREATED : HttpStatus.OK);
    return result.link;
  }

  @Delete('tasks/:id/pull-requests/:linkId')
  @HttpCode(204)
  @Authenticated(SCOPE_TASKS_WRITE)
  async unlink(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Param('linkId') linkId: string) {
    await this.unlinkPullRequest.execute(principal, id, linkId);
  }
}
