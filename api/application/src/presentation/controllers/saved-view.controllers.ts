import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated } from '@infrastructure/auth/authenticated.decorator';
import { CurrentPrincipal } from '@infrastructure/auth/current-principal.decorator';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { SCOPE_TASKS_READ, SCOPE_TASKS_WRITE } from '@domain/constants/scopes.constant';
import { SavedViewsUseCase } from '@application/use-cases/saved-view/saved-views.use-case';
import { SaveViewDto } from '@shared/dtos/saved-view/save-view.dto';

@ApiTags('Saved views')
@Controller('saved-views')
export class SavedViewController {
  constructor(private readonly views: SavedViewsUseCase) {}

  @Get()
  @Authenticated(SCOPE_TASKS_READ)
  list(@CurrentPrincipal() principal: AuthPrincipal, @Query('listId') listId?: string) {
    return this.views.list(principal, listId);
  }

  @Post()
  @Authenticated(SCOPE_TASKS_WRITE)
  create(@CurrentPrincipal() principal: AuthPrincipal, @Body() dto: SaveViewDto) {
    return this.views.create(principal, dto);
  }

  @Patch(':id')
  @Authenticated(SCOPE_TASKS_WRITE)
  update(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Body() dto: SaveViewDto) {
    return this.views.update(principal, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Authenticated(SCOPE_TASKS_WRITE)
  async remove(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    await this.views.remove(principal, id);
  }
}
