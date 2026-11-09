export class CustomFieldListScopePolicy {
  static resolve(attached: Iterable<string>, spaceListIds: string[]): string[] | null {
    const set = new Set(attached);
    if (set.size === 0) return null;
    if (spaceListIds.length > 0 && spaceListIds.every(id => set.has(id))) return null;
    return [...set].sort();
  }

  static appliesTo(listIds: string[] | null, listId: string | null): boolean {
    return listIds === null || (listId !== null && listIds.includes(listId));
  }
}
