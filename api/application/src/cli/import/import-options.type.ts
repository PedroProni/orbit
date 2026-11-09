import { ImportReport } from './import-report.type';

export type ImportPhase = 'all' | 'data' | 'files' | 'fields';

export interface ImportOptions {
  teamId?: string;
  withComments: boolean;
  phase: ImportPhase;
  zone: string;
  log: (message: string) => void;
  checkpoint?: (report: ImportReport) => void;
}
