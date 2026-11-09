export interface GithubResponse<T> {
  status: number;
  data: T | null;
}
