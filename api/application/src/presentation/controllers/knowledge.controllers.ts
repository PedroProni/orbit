import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated } from '@infrastructure/auth/authenticated.decorator';
import { CurrentPrincipal } from '@infrastructure/auth/current-principal.decorator';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { SCOPE_TASKS_READ, SCOPE_TASKS_WRITE } from '@domain/constants/scopes.constant';
import { DocsUseCase } from '@application/use-cases/doc/docs.use-case';
import { GoalsUseCase } from '@application/use-cases/goal/goals.use-case';
import { DashboardsUseCase } from '@application/use-cases/dashboard/dashboards.use-case';
import { SaveDocDto } from '@shared/dtos/doc/save-doc.dto';
import { SaveGoalDto } from '@shared/dtos/goal/save-goal.dto';
import { SaveDashboardDto } from '@shared/dtos/dashboard/save-dashboard.dto';

@ApiTags('Docs')
@Controller('docs')
export class DocController {
  constructor(private readonly docs: DocsUseCase) {}

  @Get()
  @Authenticated(SCOPE_TASKS_READ)
  list(@CurrentPrincipal() principal: AuthPrincipal, @Query('spaceId') spaceId?: string) {
    return this.docs.list(principal, spaceId);
  }

  @Get(':id')
  @Authenticated(SCOPE_TASKS_READ)
  get(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    return this.docs.get(principal, id);
  }

  @Post()
  @Authenticated(SCOPE_TASKS_WRITE)
  create(@CurrentPrincipal() principal: AuthPrincipal, @Body() dto: SaveDocDto) {
    return this.docs.create(principal, dto);
  }

  @Patch(':id')
  @Authenticated(SCOPE_TASKS_WRITE)
  update(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Body() dto: SaveDocDto) {
    return this.docs.update(principal, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Authenticated(SCOPE_TASKS_WRITE)
  async archive(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    await this.docs.archive(principal, id);
  }
}

@ApiTags('Goals')
@Controller('goals')
export class GoalController {
  constructor(private readonly goals: GoalsUseCase) {}

  @Get()
  @Authenticated(SCOPE_TASKS_READ)
  list(@CurrentPrincipal() principal: AuthPrincipal) {
    return this.goals.list(principal);
  }

  @Get(':id')
  @Authenticated(SCOPE_TASKS_READ)
  get(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    return this.goals.get(principal, id);
  }

  @Post()
  @Authenticated(SCOPE_TASKS_WRITE)
  create(@CurrentPrincipal() principal: AuthPrincipal, @Body() dto: SaveGoalDto) {
    return this.goals.create(principal, dto);
  }

  @Patch(':id')
  @Authenticated(SCOPE_TASKS_WRITE)
  update(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Body() dto: SaveGoalDto) {
    return this.goals.update(principal, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Authenticated(SCOPE_TASKS_WRITE)
  async remove(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    await this.goals.remove(principal, id);
  }
}

@ApiTags('Dashboards')
@Controller('dashboards')
export class DashboardController {
  constructor(private readonly dashboards: DashboardsUseCase) {}

  @Get()
  @Authenticated(SCOPE_TASKS_READ)
  list(@CurrentPrincipal() principal: AuthPrincipal) {
    return this.dashboards.list(principal);
  }

  @Get(':id/data')
  @Authenticated(SCOPE_TASKS_READ)
  data(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    return this.dashboards.data(principal, id);
  }

  @Post()
  @Authenticated(SCOPE_TASKS_WRITE)
  create(@CurrentPrincipal() principal: AuthPrincipal, @Body() dto: SaveDashboardDto) {
    return this.dashboards.create(principal, dto);
  }

  @Patch(':id')
  @Authenticated(SCOPE_TASKS_WRITE)
  update(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Body() dto: SaveDashboardDto) {
    return this.dashboards.update(principal, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Authenticated(SCOPE_TASKS_WRITE)
  async remove(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    await this.dashboards.remove(principal, id);
  }
}
