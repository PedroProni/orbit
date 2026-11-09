import { DependencyPolicy } from '@domain/policies/dependency.policy';

const edge = (taskId: string, dependsOnId: string) => ({ taskId, dependsOnId });

describe('DependencyPolicy edge cases', () => {
  it('allows an edge between unrelated tasks on an empty graph', () => {
    expect(DependencyPolicy.wouldCreateCycle([], 'a', 'b')).toBe(false);
  });

  it('allows re-adding an edge that already exists', () => {
    expect(DependencyPolicy.wouldCreateCycle([edge('a', 'b')], 'a', 'b')).toBe(false);
  });

  it('rejects the reverse of an existing edge', () => {
    expect(DependencyPolicy.wouldCreateCycle([edge('b', 'a')], 'a', 'b')).toBe(true);
  });

  it('detects a cycle through a long chain', () => {
    const chain = [edge('b', 'a'), edge('c', 'b'), edge('d', 'c'), edge('e', 'd')];
    expect(DependencyPolicy.wouldCreateCycle(chain, 'a', 'e')).toBe(true);
    expect(DependencyPolicy.wouldCreateCycle(chain, 'e', 'a')).toBe(false);
  });

  it('handles diamond shaped graphs', () => {
    const diamond = [edge('b', 'a'), edge('c', 'a'), edge('d', 'b'), edge('d', 'c')];
    expect(DependencyPolicy.wouldCreateCycle(diamond, 'a', 'd')).toBe(true);
    expect(DependencyPolicy.wouldCreateCycle(diamond, 'e', 'd')).toBe(false);
  });

  it('ignores edges in disconnected components', () => {
    const edges = [edge('b', 'a'), edge('y', 'x')];
    expect(DependencyPolicy.wouldCreateCycle(edges, 'x', 'b')).toBe(false);
  });

  it('does not mutate the edge list', () => {
    const edges = [edge('b', 'a')];
    const copy = JSON.parse(JSON.stringify(edges));
    DependencyPolicy.wouldCreateCycle(edges, 'a', 'b');
    expect(edges).toEqual(copy);
  });
});
