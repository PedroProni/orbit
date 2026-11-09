import { GithubSyncReport } from '@domain/types/github-sync-report.type';
import { GithubSyncCursors } from '@domain/types/github-sync-cursors.type';

export interface GithubSyncResult {
  report: GithubSyncReport;
  cursors: GithubSyncCursors;
}
