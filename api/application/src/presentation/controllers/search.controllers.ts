import { Controller, Get, MessageEvent, Query, Sse } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SetMetadata } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Authenticated } from '@infrastructure/auth/authenticated.decorator';
import { CurrentPrincipal } from '@infrastructure/auth/current-principal.decorator';
import { ALLOW_QUERY_SESSION_KEY } from '@infrastructure/auth/auth.constants';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { SCOPE_TASKS_READ } from '@domain/constants/scopes.constant';
import { SearchUseCase } from '@application/use-cases/task/search.use-case';
import { RealtimeService } from '@application/services/realtime.service';
import { SearchQueryDto } from '@shared/dtos/task/search-query.dto';

@ApiTags('Search and events')
@Controller()
export class SearchController {
  constructor(
    private readonly search: SearchUseCase,
    private readonly realtime: RealtimeService,
  ) {}

  @Get('search')
  @Authenticated(SCOPE_TASKS_READ)
  find(@CurrentPrincipal() principal: AuthPrincipal, @Query() query: SearchQueryDto) {
    return this.search.execute(principal, query.q, query.limit ?? 20);
  }

  @Sse('events')
  @SetMetadata(ALLOW_QUERY_SESSION_KEY, true)
  @Authenticated(SCOPE_TASKS_READ)
  events(@CurrentPrincipal() principal: AuthPrincipal): Observable<MessageEvent> {
    return this.realtime.stream(principal.workspaceId).pipe(map((event) => ({ type: event.type, data: event })));
  }
}
