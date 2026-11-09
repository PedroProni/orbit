import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CUSTOM_FIELD_DEFINITION_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { CustomFieldDefinitionRepository } from '@domain/repositories/custom-field-definition.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { AuditService } from '@application/services/audit.service';

@Injectable()
export class DeleteCustomFieldUseCase {
  constructor(
    @Inject(CUSTOM_FIELD_DEFINITION_INJECT_TOKEN) private readonly fields: CustomFieldDefinitionRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(principal: AuthPrincipal, fieldId: string): Promise<void> {
    const field = await this.fields.findByIdInWorkspace(fieldId, principal.workspaceId);
    if (!field) throw new NotFoundException('Custom field not found');
    await this.fields.delete(fieldId);
    await this.audit.record(principal, 'custom_field.deleted', 'custom_field', fieldId);
  }
}
