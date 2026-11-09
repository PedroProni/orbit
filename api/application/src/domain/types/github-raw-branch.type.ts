export interface GithubRawBranch {
  name: string;
  commit?: { sha?: string } | null;
}
