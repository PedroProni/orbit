import { GoalTargetKind } from '@domain/enums/goal.enums';
import { GoalTarget } from '@domain/types/goal-target.type';

export class GoalProgressPolicy {
  static targetProgress(target: GoalTarget, closedTaskIds: Set<string>): number {
    if (target.kind === GoalTargetKind.TASK) return target.taskId && closedTaskIds.has(target.taskId) ? 100 : 0;
    if (target.targetValue <= 0) return target.currentValue > 0 ? 100 : 0;
    return Math.min(100, Math.max(0, Math.round((target.currentValue / target.targetValue) * 100)));
  }

  static progress(targets: GoalTarget[], closedTaskIds: Set<string>): number {
    if (!targets.length) return 0;
    return Math.round(targets.reduce((sum, t) => sum + GoalProgressPolicy.targetProgress(t, closedTaskIds), 0) / targets.length);
  }
}
