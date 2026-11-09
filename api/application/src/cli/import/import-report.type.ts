export interface ImportMismatch {
  entity: string;
  clickupId: string;
  reason: string;
}

export interface ImportCounts {
  fetched: number;
  stored: number;
}

export interface ImportNotCopied {
  count: number;
  reason: string;
}

export interface ImportFileFailure {
  attachmentId: string;
  taskId: string;
  reason: string;
}

export interface ImportFilesSummary {
  total: number;
  downloaded: number;
  alreadyStored: number;
  failed: number;
  bytesStored: number;
  bytesDeclared: number;
  failures: ImportFileFailure[];
}

export interface ImportDateOrigin {
  taskId: string;
  field: 'due' | 'start';
  raw: string;
  instant: string;
  hasTime: boolean | null;
  localDay: string;
}

export interface ImportStatusMapping {
  original: string;
  status: string;
  tasks: number;
  closest: boolean;
}

export interface ImportStatusOrigin {
  taskId: string;
  original: string;
  status: string;
}

export interface ImportReport {
  startedAt: string;
  finishedAt: string;
  stage: string;
  zone: string;
  requests: number;
  fileRequests: number;
  maxRequestsInAnyMinute: number;
  counts: Record<string, ImportCounts>;
  mismatches: ImportMismatch[];
  notCopied: Record<string, ImportNotCopied>;
  files: ImportFilesSummary | null;
  dateOrigins: ImportDateOrigin[];
  statusMapping: ImportStatusMapping[];
  statusOrigins: ImportStatusOrigin[];
}
