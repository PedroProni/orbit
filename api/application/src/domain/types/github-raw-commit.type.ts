export interface GithubRawCommit {
  sha: string;
  html_url?: string;
  author?: { login?: string } | null;
  commit?: { message?: string; author?: { date?: string } | null; committer?: { date?: string } | null } | null;
}
