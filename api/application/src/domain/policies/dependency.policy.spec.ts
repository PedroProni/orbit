import { DependencyPolicy } from '@domain/policies/dependency.policy';

describe('DependencyPolicy', () => {
  const edges = [{ taskId: 'b', dependsOnId: 'a' }, { taskId: 'c', dependsOnId: 'b' }];

  it('rejects self dependency', () => {
    expect(DependencyPolicy.wouldCreateCycle([], 'a', 'a')).toBe(true);
  });

  it('detects direct and transitive cycles', () => {
    expect(DependencyPolicy.wouldCreateCycle(edges, 'a', 'b')).toBe(true);
    expect(DependencyPolicy.wouldCreateCycle(edges, 'a', 'c')).toBe(true);
  });

  it('allows independent and forward edges', () => {
    expect(DependencyPolicy.wouldCreateCycle(edges, 'd', 'a')).toBe(false);
    expect(DependencyPolicy.wouldCreateCycle(edges, 'c', 'a')).toBe(false);
  });

  it('terminates on a pre-existing cycle in the data', () => {
    const loop = [{ taskId: 'x', dependsOnId: 'y' }, { taskId: 'y', dependsOnId: 'x' }];
    expect(DependencyPolicy.wouldCreateCycle(loop, 'z', 'x')).toBe(false);
  });
});
