import { TaskEntity } from '@domain/entities/task.entity';

export class TaskPresenter {
  static toView(task: TaskEntity) {
    return {
      id: task.getId(),
      listId: task.getListId(),
      spaceId: task.getSpaceId(),
      parentId: task.getParentId(),
      title: task.getTitle(),
      descriptionMd: task.getDescriptionMd(),
      status: task.getStatus(),
      priority: task.getPriority(),
      tags: task.getTags(),
      assigneeIds: task.getAssigneeIds(),
      watcherIds: task.getWatcherIds(),
      points: task.getPoints(),
      startDate: task.getStartDate(),
      dueDate: task.getDueDate(),
      customFields: task.getCustomFields(),
      checklists: task.getChecklists(),
      creatorId: task.getCreatorId(),
      dateClosed: task.getDateClosed(),
      archived: task.getArchived(),
      createdAt: task.getCreatedAt(),
      updatedAt: task.getUpdatedAt(),
    };
  }
}
