import { ImportCounts, ImportMismatch, ImportNotCopied } from './import-report.type';

export class ImportLedger {
  readonly counts: Record<string, ImportCounts> = {};
  readonly mismatches: ImportMismatch[] = [];
  readonly notCopied: Record<string, ImportNotCopied> = {};

  track(key: string, fetched: number, stored: number): void {
    const current = this.counts[key] ?? { fetched: 0, stored: 0 };
    this.counts[key] = { fetched: current.fetched + fetched, stored: current.stored + stored };
  }

  mismatch(entity: string, clickupId: string, reason: string): void {
    this.mismatches.push({ entity, clickupId, reason });
  }

  skip(key: string, count: number, reason: string): void {
    if (count === 0) return;
    this.notCopied[key] = { count: (this.notCopied[key]?.count ?? 0) + count, reason };
  }
}
