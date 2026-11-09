export class TaskCreationPolicy {
  static hasAllowedPrefix(title: string, prefixes: string[]): boolean {
    if (prefixes.length === 0) return true;
    return prefixes.some((prefix) => new RegExp(`^\\[${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[ .][^\\]]*)?\\]`, 'i').test(title.trim()));
  }

  static hasRequiredTag(tags: string[], requiredTags: string[]): boolean {
    if (requiredTags.length === 0) return true;
    const normalized = tags.map((t) => t.trim().toLowerCase());
    return requiredTags.some((required) => normalized.includes(required.trim().toLowerCase()));
  }
}
