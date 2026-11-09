export interface GithubRawCheckRuns {
  total_count?: number;
  check_runs?: Array<{ status?: string; conclusion?: string | null }>;
}
