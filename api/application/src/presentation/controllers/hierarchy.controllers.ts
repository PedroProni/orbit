import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GuestReadable } from '@infrastructure/auth/guest-readable.decorator';
import { Authenticated } from '@infrastructure/auth/authenticated.decorator';
import { CurrentPrincipal } from '@infrastructure/auth/current-principal.decorator';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { SprintKind } from '@domain/enums/list.enums';
import { SCOPE_STRUCTURE_WRITE, SCOPE_WORKSPACE_READ } from '@domain/constants/scopes.constant';
import { toDateOrNull } from '@common/helpers/functions/date.helper';
import { GetHierarchyUseCase } from '@application/use-cases/hierarchy/get-hierarchy.use-case';
import { CreateSpaceUseCase } from '@application/use-cases/hierarchy/create-space.use-case';
import { UpdateSpaceUseCase } from '@application/use-cases/hierarchy/update-space.use-case';
import { CreateFolderUseCase } from '@application/use-cases/hierarchy/create-folder.use-case';
import { RenameFolderUseCase } from '@application/use-cases/hierarchy/rename-folder.use-case';
import { DeleteFolderUseCase } from '@application/use-cases/hierarchy/delete-folder.use-case';
import { CreateListUseCase } from '@application/use-cases/hierarchy/create-list.use-case';
import { UpdateListUseCase } from '@application/use-cases/hierarchy/update-list.use-case';
import { DeleteListUseCase } from '@application/use-cases/hierarchy/delete-list.use-case';
import { CreateSpaceDto } from '@shared/dtos/hierarchy/create-space.dto';
import { UpdateSpaceDto } from '@shared/dtos/hierarchy/update-space.dto';
import { FolderNameDto } from '@shared/dtos/hierarchy/folder-name.dto';
import { CreateListDto } from '@shared/dtos/hierarchy/create-list.dto';
import { UpdateListDto } from '@shared/dtos/hierarchy/update-list.dto';

@ApiTags('Hierarchy')
@Controller()
export class HierarchyController {
  constructor(
    private readonly getHierarchy: GetHierarchyUseCase,
    private readonly createSpace: CreateSpaceUseCase,
    private readonly updateSpace: UpdateSpaceUseCase,
    private readonly createFolder: CreateFolderUseCase,
    private readonly renameFolder: RenameFolderUseCase,
    private readonly deleteFolder: DeleteFolderUseCase,
    private readonly createList: CreateListUseCase,
    private readonly updateList: UpdateListUseCase,
    private readonly deleteList: DeleteListUseCase,
  ) {}

  @Get('hierarchy')
  @GuestReadable()
  @Authenticated(SCOPE_WORKSPACE_READ)
  tree(@CurrentPrincipal() principal: AuthPrincipal) {
    return this.getHierarchy.execute(principal);
  }

  @Post('spaces')
  @Authenticated(SCOPE_STRUCTURE_WRITE)
  space(@CurrentPrincipal() principal: AuthPrincipal, @Body() dto: CreateSpaceDto) {
    return this.createSpace.execute(principal, dto);
  }

  @Patch('spaces/:id')
  @Authenticated(SCOPE_STRUCTURE_WRITE)
  patchSpace(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Body() dto: UpdateSpaceDto) {
    return this.updateSpace.execute(principal, id, { ...dto, statuses: dto.statuses?.map((s) => ({ name: s.name, color: s.color, type: s.type, order: s.order ?? 0 })) });
  }

  @Post('spaces/:id/folders')
  @Authenticated(SCOPE_STRUCTURE_WRITE)
  folder(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') spaceId: string, @Body() dto: FolderNameDto) {
    return this.createFolder.execute(principal, { spaceId, name: dto.name });
  }

  @Patch('folders/:id')
  @Authenticated(SCOPE_STRUCTURE_WRITE)
  patchFolder(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Body() dto: FolderNameDto) {
    return this.renameFolder.execute(principal, id, dto.name);
  }

  @Delete('folders/:id')
  @HttpCode(204)
  @Authenticated(SCOPE_STRUCTURE_WRITE)
  async removeFolder(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    await this.deleteFolder.execute(principal, id);
  }

  @Post('spaces/:id/lists')
  @Authenticated(SCOPE_STRUCTURE_WRITE)
  list(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') spaceId: string, @Body() dto: CreateListDto) {
    return this.createList.execute(principal, { spaceId, folderId: dto.folderId ?? null, name: dto.name, kind: dto.kind ?? SprintKind.LIST, startDate: toDateOrNull(dto.startDate), endDate: toDateOrNull(dto.endDate) });
  }

  @Patch('lists/:id')
  @Authenticated(SCOPE_STRUCTURE_WRITE)
  patchList(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Body() dto: UpdateListDto) {
    return this.updateList.execute(principal, id, {
      name: dto.name,
      folderId: dto.folderId,
      startDate: dto.startDate === undefined ? undefined : toDateOrNull(dto.startDate),
      endDate: dto.endDate === undefined ? undefined : toDateOrNull(dto.endDate),
    });
  }

  @Delete('lists/:id')
  @HttpCode(204)
  @Authenticated(SCOPE_STRUCTURE_WRITE)
  async removeList(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    await this.deleteList.execute(principal, id);
  }
}
