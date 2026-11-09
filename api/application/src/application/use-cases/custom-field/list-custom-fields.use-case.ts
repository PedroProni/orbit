import { Inject, Injectable } from '@nestjs/common';
import { CUSTOM_FIELD_DEFINITION_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { CustomFieldDefinitionRepository } from '@domain/repositories/custom-field-definition.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { HierarchyPresenter } from '@application/presenters/hierarchy.presenter';

@Injectable()
export class ListCustomFieldsUseCase {
  constructor(@Inject(CUSTOM_FIELD_DEFINITION_INJECT_TOKEN) private readonly fields: CustomFieldDefinitionRepository) {}

  async execute(principal: AuthPrincipal, spaceId: string) {
    const rows = await this.fields.findMany({ workspace_id: principal.workspaceId, space_id: spaceId }, { created_at: 1 });
    return rows.map(HierarchyPresenter.customField);
  }
}
