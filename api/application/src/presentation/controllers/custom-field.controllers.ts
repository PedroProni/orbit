import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated } from '@infrastructure/auth/authenticated.decorator';
import { CurrentPrincipal } from '@infrastructure/auth/current-principal.decorator';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { SCOPE_STRUCTURE_WRITE, SCOPE_WORKSPACE_READ } from '@domain/constants/scopes.constant';
import { CreateCustomFieldUseCase } from '@application/use-cases/custom-field/create-custom-field.use-case';
import { ListCustomFieldsUseCase } from '@application/use-cases/custom-field/list-custom-fields.use-case';
import { DeleteCustomFieldUseCase } from '@application/use-cases/custom-field/delete-custom-field.use-case';
import { UpdateCustomFieldUseCase } from '@application/use-cases/custom-field/update-custom-field.use-case';
import { CreateCustomFieldDto } from '@shared/dtos/custom-field/create-custom-field.dto';
import { UpdateCustomFieldDto } from '@shared/dtos/custom-field/update-custom-field.dto';

@ApiTags('Custom fields')
@Controller()
export class CustomFieldController {
  constructor(
    private readonly createField: CreateCustomFieldUseCase,
    private readonly listFields: ListCustomFieldsUseCase,
    private readonly deleteField: DeleteCustomFieldUseCase,
    private readonly updateField: UpdateCustomFieldUseCase,
  ) {}

  @Post('spaces/:id/custom-fields')
  @Authenticated(SCOPE_STRUCTURE_WRITE)
  create(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') spaceId: string, @Body() dto: CreateCustomFieldDto) {
    return this.createField.execute(principal, { spaceId, name: dto.name, type: dto.type, options: dto.options ?? [], listIds: dto.listIds ?? null });
  }

  @Get('spaces/:id/custom-fields')
  @Authenticated(SCOPE_WORKSPACE_READ)
  list(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') spaceId: string) {
    return this.listFields.execute(principal, spaceId);
  }

  @Patch('custom-fields/:id')
  @Authenticated(SCOPE_STRUCTURE_WRITE)
  update(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Body() dto: UpdateCustomFieldDto) {
    return this.updateField.execute(principal, id, { name: dto.name, listIds: dto.listIds });
  }

  @Delete('custom-fields/:id')
  @HttpCode(204)
  @Authenticated(SCOPE_STRUCTURE_WRITE)
  async remove(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    await this.deleteField.execute(principal, id);
  }
}
