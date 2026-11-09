import { GoalTargetKind } from '@domain/enums/goal.enums';

export interface GoalTarget {
  id: string;
  name: string;
  kind: GoalTargetKind;
  targetValue: number;
  currentValue: number;
  taskId: string | null;
}
