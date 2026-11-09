export interface GithubPullRequestPayload {
  action?: string;
  repository?: { full_name?: string };
  pull_request?: { number: number; title?: string; body?: string | null; html_url?: string; merged?: boolean; head?: { ref?: string } };
}
