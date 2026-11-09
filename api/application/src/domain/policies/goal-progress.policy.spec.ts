import { GoalProgressPolicy } from '@domain/policies/goal-progress.policy';
import { GoalTargetKind } from '@domain/enums/goal.enums';
import { GoalTarget } from '@domain/types/goal-target.type';

const target = (over: Partial<GoalTarget>): GoalTarget => ({ id: 't', name: 'n', kind: GoalTargetKind.NUMBER, targetValue: 100, currentValue: 0, taskId: null, ...over });

describe('GoalProgressPolicy', () => {
  it('clamps numeric progress between 0 and 100', () => {
    expect(GoalProgressPolicy.targetProgress(target({ currentValue: 250 }), new Set())).toBe(100);
    expect(GoalProgressPolicy.targetProgress(target({ currentValue: 25 }), new Set())).toBe(25);
  });

  it('counts closed task targets as complete', () => {
    const t = target({ kind: GoalTargetKind.TASK, taskId: 'x', targetValue: 0 });
    expect(GoalProgressPolicy.targetProgress(t, new Set(['x']))).toBe(100);
    expect(GoalProgressPolicy.targetProgress(t, new Set())).toBe(0);
  });

  it('averages targets and returns zero for none', () => {
    expect(GoalProgressPolicy.progress([], new Set())).toBe(0);
    expect(GoalProgressPolicy.progress([target({ currentValue: 100 }), target({ currentValue: 0 })], new Set())).toBe(50);
  });
});
