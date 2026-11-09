import { BadRequestException, Injectable } from '@nestjs/common';
import { CustomFieldDefinitionRepository } from '@domain/repositories/custom-field-definition.repository';
import { TaskCustomFieldValue } from '@domain/types/task-custom-field-value.type';
import { guardDomain } from '@common/helpers/functions/domain-guard.helper';

@Injectable()
export class CustomFieldValidationService {
  async validate(repo: CustomFieldDefinitionRepository, workspaceId: string, spaceId: string, values: TaskCustomFieldValue[]): Promise<void> {
    if (values.length === 0) return;
    const definitions = await repo.findMany({ workspace_id: workspaceId, space_id: spaceId });
    for (const value of values) {
      const definition = definitions.find((d) => d.getId() === value.fieldId);
      if (!definition) throw new BadRequestException(`Unknown custom field ${value.fieldId}`);
      guardDomain(() => definition.validateValue(value.value));
    }
  }
}
