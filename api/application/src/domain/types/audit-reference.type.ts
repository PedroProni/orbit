export type AuditReference = { label: string | null; deleted: boolean };
export type AuditReferences = { actors: Map<string, AuditReference>; entities: Map<string, AuditReference> };
