import { TaskEntity } from '@domain/entities/task.entity';
import { BaseRepository } from '@domain/repositories/base.repository';
import { AssigneeCounts } from '@domain/types/assignee-counts.type';
import { TaskSetModifications } from '@domain/types/set-modification.type';

export interface TaskRepository extends BaseRepository<TaskEntity> {
  modifySets(id: string, workspaceId: string, modifications: TaskSetModifications): Promise<void>;
  countByAssignee(filter: Record<string, unknown>): Promise<AssigneeCounts>;
}
