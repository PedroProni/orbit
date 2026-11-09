import { SpaceEntity } from '@domain/entities/space.entity';
import { FolderEntity } from '@domain/entities/folder.entity';
import { TaskListEntity } from '@domain/entities/task-list.entity';
import { CustomFieldDefinitionEntity } from '@domain/entities/custom-field-definition.entity';

export class HierarchyPresenter {
  static space(space: SpaceEntity) {
    return { id: space.getId(), name: space.getName(), statuses: space.getStatuses(), requiredTags: space.getRequiredTags(), titlePrefixes: space.getTitlePrefixes() };
  }

  static folder(folder: FolderEntity) {
    return { id: folder.getId(), spaceId: folder.getSpaceId(), name: folder.getName(), order: folder.getOrder() };
  }

  static list(list: TaskListEntity) {
    return {
      id: list.getId(),
      spaceId: list.getSpaceId(),
      folderId: list.getFolderId(),
      name: list.getName(),
      kind: list.getKind(),
      startDate: list.getStartDate(),
      endDate: list.getEndDate(),
      order: list.getOrder(),
    };
  }

  static customField(field: CustomFieldDefinitionEntity) {
    return { id: field.getId(), spaceId: field.getSpaceId(), name: field.getName(), type: field.getType(), options: field.getOptions(), listIds: field.getListIds() };
  }
}
