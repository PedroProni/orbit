export type WorkspaceSummaryView = {
  workspace: { name: string; slug: string; createdAt: Date } | null;
  members: { byRole: Record<string, number>; byStatus: Record<string, number> };
  counts: { spaces: number; folders: number; lists: number; openTasks: number; closedTasks: number; docs: number };
  integrations: { githubWebhookSecret: boolean; githubToken: boolean; githubRepositories: number; automationKey: boolean; fileStorage: boolean; devLogin: boolean };
};
