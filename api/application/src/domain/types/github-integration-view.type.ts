export type GithubRepositoryStatusView = { fullName: string; lastSuccessAt: Date | null; syncing: boolean };
export type GithubIntegrationView = { secretConfigured: boolean; tokenConfigured: boolean; webhookPath: string; syncIntervalMs: number; repositories: GithubRepositoryStatusView[] };
