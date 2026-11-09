import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SPACE_INJECT_TOKEN, CUSTOM_FIELD_DEFINITION_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { SpaceRepository } from '@domain/repositories/space.repository';
import { CustomFieldDefinitionRepository } from '@domain/repositories/custom-field-definition.repository';
import { CustomFieldDefinitionEntity } from '@domain/entities/custom-field-definition.entity';
import { CustomFieldType } from '@domain/enums/custom-field.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { newId } from '@common/helpers/functions/id.helper';
import { AuditService } from '@application/services/audit.service';
import { CustomFieldListsService } from '@application/services/custom-field-lists.service';
import { CreateCustomFieldCommand } from '@application/commands/custom-field/create-custom-field.command';
import { HierarchyPresenter } from '@application/presenters/hierarchy.presenter';

@Injectable()
export class CreateCustomFieldUseCase {
  constructor(
    @Inject(SPACE_INJECT_TOKEN) private readonly spaces: SpaceRepository,
    @Inject(CUSTOM_FIELD_DEFINITION_INJECT_TOKEN) private readonly fields: CustomFieldDefinitionRepository,
    private readonly fieldLists: CustomFieldListsService,
    private readonly audit: AuditService,
  ) {}

  async execute(principal: AuthPrincipal, command: CreateCustomFieldCommand) {
    const space = await this.spaces.findByIdInWorkspace(command.spaceId, principal.workspaceId);
    if (!space) throw new NotFoundException('Space not found');
    if (command.type === CustomFieldType.DROPDOWN && command.options.length === 0) throw new BadRequestException('Dropdown needs options');
    const listIds = await this.fieldLists.resolve(principal.workspaceId, space.getId(), command.listIds);
    const now = new Date();
    const options = command.type === CustomFieldType.DROPDOWN ? command.options.map(label => ({ id: newId(), label: label.trim(), color: '#6b7cff' })) : [];
    const saved = await this.fields.create(
      new CustomFieldDefinitionEntity({
        _id: newId(),
        workspaceId: principal.workspaceId,
        spaceId: space.getId(),
        name: command.name.trim(),
        type: command.type,
        options,
        listIds,
        createdAt: now,
        updatedAt: now,
      }),
    );
    await this.audit.record(principal, 'custom_field.created', 'custom_field', saved.getId(), { name: saved.getName(), type: saved.getType(), listIds: saved.getListIds() });
    return HierarchyPresenter.customField(saved);
  }
}
