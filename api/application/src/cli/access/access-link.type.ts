export interface IssueAccessLinksOptions {
  email?: string;
  all: boolean;
  baseUrl: string;
  now: Date;
}

export interface IssuedLinkRow {
  email: string;
  kind: string;
  expiresAt: Date;
  link: string;
}
