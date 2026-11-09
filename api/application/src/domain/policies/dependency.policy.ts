export class DependencyPolicy {
  static wouldCreateCycle(edges: Array<{ taskId: string; dependsOnId: string }>, taskId: string, dependsOnId: string): boolean {
    if (taskId === dependsOnId) return true;
    const blockers = new Map<string, string[]>();
    for (const edge of edges) blockers.set(edge.taskId, [...(blockers.get(edge.taskId) ?? []), edge.dependsOnId]);
    const seen = new Set<string>();
    const stack = [dependsOnId];
    while (stack.length) {
      const current = stack.pop() as string;
      if (current === taskId) return true;
      if (seen.has(current)) continue;
      seen.add(current);
      stack.push(...(blockers.get(current) ?? []));
    }
    return false;
  }
}
