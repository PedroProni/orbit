import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TASK_LIST_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { TaskListRepository } from '@domain/repositories/task-list.repository';

@Injectable()
export class CustomFieldListsService {
  constructor(@Inject(TASK_LIST_INJECT_TOKEN) private readonly lists: TaskListRepository) {}

  async resolve(workspaceId: string, spaceId: string, listIds: string[] | null | undefined): Promise<string[] | null> {
    if (listIds === null || listIds === undefined) return null;
    const unique = [...new Set(listIds)];
    if (unique.length === 0) throw new BadRequestException('Choose at least one list or apply the field to the whole space');
    const found = await this.lists.count({ workspace_id: workspaceId, space_id: spaceId, _id: { $in: unique } });
    if (found !== unique.length) throw new BadRequestException('Every list must belong to the field space');
    return unique.sort();
  }
}
