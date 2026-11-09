export interface GithubCommit {
  sha: string;
  message: string;
  url: string;
  authorLogin: string | null;
  committedAt: Date | null;
}
