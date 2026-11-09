import { GoalTarget } from '@domain/types/goal-target.type';

export interface GoalEntityProps {
  _id: string;
  workspaceId: string;
  name: string;
  description: string;
  ownerId: string;
  dueDate: Date | null;
  targets: GoalTarget[];
  createdAt: Date;
  updatedAt: Date;
}
