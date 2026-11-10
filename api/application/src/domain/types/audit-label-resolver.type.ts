export type AuditLabelResolver = (workspaceId: string, ids: string[]) => Promise<Map<string, string | null>>;
