import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated } from '@infrastructure/auth/authenticated.decorator';
import { CurrentPrincipal } from '@infrastructure/auth/current-principal.decorator';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { SCOPE_STRUCTURE_WRITE, SCOPE_TASKS_READ, SCOPE_TASKS_WRITE } from '@domain/constants/scopes.constant';
import { TaskDependenciesUseCase } from '@application/use-cases/planning/task-dependencies.use-case';
import { TaskPlansUseCase } from '@application/use-cases/planning/task-plans.use-case';
import { TimeTrackingUseCase } from '@application/use-cases/planning/time-tracking.use-case';
import { TaskTemplatesUseCase } from '@application/use-cases/planning/task-templates.use-case';
import { TaskRecurrenceUseCase } from '@application/use-cases/planning/task-recurrence.use-case';
import { AddDependencyDto } from '@shared/dtos/planning/add-dependency.dto';
import { ChangePlanDto } from '@shared/dtos/planning/change-plan.dto';
import { ManualTimeDto } from '@shared/dtos/planning/manual-time.dto';
import { SetRecurrenceDto } from '@shared/dtos/planning/set-recurrence.dto';
import { SaveTemplateDto } from '@shared/dtos/planning/save-template.dto';
import { InstantiateTemplateDto } from '@shared/dtos/planning/instantiate-template.dto';

@ApiTags('Planning')
@Controller()
export class PlanningController {
  constructor(
    private readonly dependencies: TaskDependenciesUseCase,
    private readonly plans: TaskPlansUseCase,
    private readonly time: TimeTrackingUseCase,
    private readonly templates: TaskTemplatesUseCase,
    private readonly recurrence: TaskRecurrenceUseCase,
  ) {}

  @Get('tasks/:id/dependencies')
  @Authenticated(SCOPE_TASKS_READ)
  listDependencies(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    return this.dependencies.list(principal, id);
  }

  @Post('tasks/:id/dependencies')
  @Authenticated(SCOPE_TASKS_WRITE)
  addDependency(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Body() dto: AddDependencyDto) {
    return this.dependencies.add(principal, id, dto.dependsOnId);
  }

  @Delete('tasks/:id/dependencies/:dependsOnId')
  @HttpCode(204)
  @Authenticated(SCOPE_TASKS_WRITE)
  async removeDependency(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Param('dependsOnId') dependsOnId: string) {
    await this.dependencies.remove(principal, id, dependsOnId);
  }

  @Get('tasks/:id/plan')
  @Authenticated(SCOPE_TASKS_READ)
  getPlan(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    return this.plans.get(principal, id);
  }

  @Patch('tasks/:id/plan')
  @Authenticated(SCOPE_TASKS_WRITE)
  changePlan(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Body() dto: ChangePlanDto) {
    return this.plans.change(principal, id, dto);
  }

  @Get('tasks/:id/time')
  @Authenticated(SCOPE_TASKS_READ)
  listTime(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    return this.time.list(principal, id);
  }

  @Post('tasks/:id/time/start')
  @Authenticated(SCOPE_TASKS_WRITE)
  startTimer(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    return this.time.start(principal, id);
  }

  @Post('tasks/:id/time/stop')
  @Authenticated(SCOPE_TASKS_WRITE)
  stopTimer(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    return this.time.stop(principal, id);
  }

  @Post('tasks/:id/time')
  @Authenticated(SCOPE_TASKS_WRITE)
  addManual(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Body() dto: ManualTimeDto) {
    return this.time.addManual(principal, id, dto);
  }

  @Delete('time-entries/:entryId')
  @HttpCode(204)
  @Authenticated(SCOPE_TASKS_WRITE)
  async removeTime(@CurrentPrincipal() principal: AuthPrincipal, @Param('entryId') entryId: string) {
    await this.time.remove(principal, entryId);
  }

  @Get('tasks/:id/recurrence')
  @Authenticated(SCOPE_TASKS_READ)
  getRecurrence(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    return this.recurrence.get(principal, id);
  }

  @Put('tasks/:id/recurrence')
  @Authenticated(SCOPE_TASKS_WRITE)
  setRecurrence(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Body() dto: SetRecurrenceDto) {
    return this.recurrence.set(principal, id, dto);
  }

  @Delete('tasks/:id/recurrence')
  @HttpCode(204)
  @Authenticated(SCOPE_TASKS_WRITE)
  async removeRecurrence(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    await this.recurrence.remove(principal, id);
  }

  @Get('task-templates')
  @Authenticated(SCOPE_TASKS_READ)
  listTemplates(@CurrentPrincipal() principal: AuthPrincipal, @Query('spaceId') spaceId?: string) {
    return this.templates.list(principal, spaceId);
  }

  @Post('task-templates')
  @Authenticated(SCOPE_STRUCTURE_WRITE)
  createTemplate(@CurrentPrincipal() principal: AuthPrincipal, @Body() dto: SaveTemplateDto) {
    return this.templates.create(principal, dto);
  }

  @Patch('task-templates/:id')
  @Authenticated(SCOPE_STRUCTURE_WRITE)
  updateTemplate(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Body() dto: SaveTemplateDto) {
    return this.templates.update(principal, id, dto);
  }

  @Delete('task-templates/:id')
  @HttpCode(204)
  @Authenticated(SCOPE_STRUCTURE_WRITE)
  async removeTemplate(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    await this.templates.remove(principal, id);
  }

  @Post('task-templates/:id/instantiate')
  @Authenticated(SCOPE_TASKS_WRITE)
  instantiateTemplate(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Body() dto: InstantiateTemplateDto) {
    return this.templates.instantiate(principal, id, dto);
  }
}
