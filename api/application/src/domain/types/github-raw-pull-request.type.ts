export interface GithubRawPullRequest {
  number: number;
  title?: string | null;
  body?: string | null;
  html_url?: string;
  state?: string;
  draft?: boolean;
  merged_at?: string | null;
  merged?: boolean;
  updated_at?: string;
  user?: { login?: string; avatar_url?: string } | null;
  head?: { ref?: string; sha?: string } | null;
}
