import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CUSTOM_FIELD_DEFINITION_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { CustomFieldDefinitionRepository } from '@domain/repositories/custom-field-definition.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { guardDomain } from '@common/helpers/functions/domain-guard.helper';
import { AuditService } from '@application/services/audit.service';
import { CustomFieldListsService } from '@application/services/custom-field-lists.service';
import { UpdateCustomFieldCommand } from '@application/commands/custom-field/update-custom-field.command';
import { HierarchyPresenter } from '@application/presenters/hierarchy.presenter';

@Injectable()
export class UpdateCustomFieldUseCase {
  constructor(
    @Inject(CUSTOM_FIELD_DEFINITION_INJECT_TOKEN) private readonly fields: CustomFieldDefinitionRepository,
    private readonly fieldLists: CustomFieldListsService,
    private readonly audit: AuditService,
  ) {}

  async execute(principal: AuthPrincipal, fieldId: string, command: UpdateCustomFieldCommand) {
    const field = await this.fields.findByIdInWorkspace(fieldId, principal.workspaceId);
    if (!field) throw new NotFoundException('Custom field not found');
    const changed: string[] = [];
    if (command.name !== undefined) {
      guardDomain(() => field.rename(command.name as string));
      changed.push('name');
    }
    if (command.listIds !== undefined) {
      field.attachToLists(await this.fieldLists.resolve(principal.workspaceId, field.getSpaceId(), command.listIds));
      changed.push('listIds');
    }
    if (changed.length === 0) return HierarchyPresenter.customField(field);
    const saved = await this.fields.patch(field, changed);
    await this.audit.record(principal, 'custom_field.updated', 'custom_field', saved.getId(), { changed, listIds: saved.getListIds() });
    return HierarchyPresenter.customField(saved);
  }
}
