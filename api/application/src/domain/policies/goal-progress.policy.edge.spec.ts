import { GoalProgressPolicy } from '@domain/policies/goal-progress.policy';
import { GoalTargetKind } from '@domain/enums/goal.enums';
import { GoalTarget } from '@domain/types/goal-target.type';

const target = (over: Partial<GoalTarget>): GoalTarget => ({ id: 't', name: 'n', kind: GoalTargetKind.NUMBER, targetValue: 100, currentValue: 0, taskId: null, ...over });

describe('GoalProgressPolicy edge cases', () => {
  it('floors negative current values at zero', () => {
    expect(GoalProgressPolicy.targetProgress(target({ currentValue: -50 }), new Set())).toBe(0);
  });

  it('rounds fractional percentages to the nearest integer', () => {
    expect(GoalProgressPolicy.targetProgress(target({ targetValue: 3, currentValue: 1 }), new Set())).toBe(33);
    expect(GoalProgressPolicy.targetProgress(target({ targetValue: 3, currentValue: 2 }), new Set())).toBe(67);
    expect(GoalProgressPolicy.targetProgress(target({ targetValue: 200, currentValue: 1 }), new Set())).toBe(1);
  });

  it('reports exactly 100 when the current value equals the target', () => {
    expect(GoalProgressPolicy.targetProgress(target({ targetValue: 40, currentValue: 40 }), new Set())).toBe(100);
  });

  it('treats boolean targets as numeric progress', () => {
    expect(GoalProgressPolicy.targetProgress(target({ kind: GoalTargetKind.BOOLEAN, targetValue: 1, currentValue: 1 }), new Set())).toBe(100);
    expect(GoalProgressPolicy.targetProgress(target({ kind: GoalTargetKind.BOOLEAN, targetValue: 1, currentValue: 0 }), new Set())).toBe(0);
  });

  it('gives zero for a task target without a task id', () => {
    expect(GoalProgressPolicy.targetProgress(target({ kind: GoalTargetKind.TASK, taskId: null }), new Set(['x']))).toBe(0);
  });

  it('ignores numeric values on task targets', () => {
    const t = target({ kind: GoalTargetKind.TASK, taskId: 'x', currentValue: 100, targetValue: 100 });
    expect(GoalProgressPolicy.targetProgress(t, new Set())).toBe(0);
  });

  it('saturates at 100 when the target value is zero and progress was made', () => {
    expect(GoalProgressPolicy.targetProgress(target({ targetValue: 0, currentValue: 5 }), new Set())).toBe(100);
  });

  it('rounds the average of targets', () => {
    const targets = [target({ currentValue: 100 }), target({ currentValue: 0 }), target({ currentValue: 0 })];
    expect(GoalProgressPolicy.progress(targets, new Set())).toBe(33);
  });

  it('mixes task and numeric targets in one average', () => {
    const targets = [target({ kind: GoalTargetKind.TASK, taskId: 'x' }), target({ currentValue: 50 })];
    expect(GoalProgressPolicy.progress(targets, new Set(['x']))).toBe(75);
  });

  it('never returns NaN when the target value is zero', () => {
    expect(GoalProgressPolicy.targetProgress(target({ targetValue: 0, currentValue: 0 }), new Set())).toBe(0);
    expect(GoalProgressPolicy.targetProgress(target({ targetValue: 0, currentValue: 5 }), new Set())).toBe(100);
  });
});
