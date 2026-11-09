import { TaskStatusDefinition } from '@domain/types/task-status-definition.type';

export interface UpdateSpaceCommand {
  name?: string;
  statuses?: TaskStatusDefinition[];
  requiredTags?: string[];
  titlePrefixes?: string[];
}
