import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated } from '@infrastructure/auth/authenticated.decorator';
import { CurrentPrincipal } from '@infrastructure/auth/current-principal.decorator';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { SCOPE_STRUCTURE_WRITE } from '@domain/constants/scopes.constant';
import { AutomationsUseCase } from '@application/use-cases/automation/automations.use-case';
import { SaveAutomationDto } from '@shared/dtos/automation/save-automation.dto';
import { UpdateAutomationDto } from '@shared/dtos/automation/update-automation.dto';

@ApiTags('Automations')
@Controller('automations')
export class AutomationController {
  constructor(private readonly automations: AutomationsUseCase) {}

  @Get()
  @Authenticated(SCOPE_STRUCTURE_WRITE)
  list(@CurrentPrincipal() principal: AuthPrincipal) {
    return this.automations.list(principal);
  }

  @Post()
  @Authenticated(SCOPE_STRUCTURE_WRITE)
  create(@CurrentPrincipal() principal: AuthPrincipal, @Body() dto: SaveAutomationDto) {
    return this.automations.create(principal, dto);
  }

  @Patch(':id')
  @Authenticated(SCOPE_STRUCTURE_WRITE)
  update(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Body() dto: UpdateAutomationDto) {
    return this.automations.update(principal, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Authenticated(SCOPE_STRUCTURE_WRITE)
  async remove(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    await this.automations.remove(principal, id);
  }

  @Get(':id/runs')
  @Authenticated(SCOPE_STRUCTURE_WRITE)
  runs(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    return this.automations.runs(principal, id);
  }
}
