import { TaskStatusDefinition } from '@domain/types/task-status-definition.type';

export interface SpaceEntityProps {
  _id: string;
  workspaceId: string;
  name: string;
  statuses: TaskStatusDefinition[];
  requiredTags: string[];
  titlePrefixes: string[];
  nextTaskSeq: number;
  createdAt: Date;
  updatedAt: Date;
}
