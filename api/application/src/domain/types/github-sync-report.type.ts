export interface GithubSyncReport {
  repository: string;
  pullRequests: number;
  branches: number;
  commits: number;
  removedBranches: number;
}
