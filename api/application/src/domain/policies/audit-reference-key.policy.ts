export class AuditReferenceKeyPolicy {
  static of(type: string, id: string): string {
    return `${type}:${id}`;
  }
}
