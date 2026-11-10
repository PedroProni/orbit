export interface WorkspaceSummary {
  workspace: { name: string; slug: string; createdAt: string } | null;
  members: { byRole: Record<string, number>; byStatus: Record<string, number> };
  counts: { spaces: number; folders: number; lists: number; openTasks: number; closedTasks: number; docs: number };
  integrations: { githubWebhookSecret: boolean; githubToken: boolean; githubRepositories: number; automationKey: boolean; fileStorage: boolean; devLogin: boolean };
}
