import { ClickupAttachmentLinks } from './clickup-attachment-links';
import { ClickupReadonlyClient } from './clickup-readonly.client';
import { LocalStore } from './local-store';
import { ImportObjectStore } from './local-object-store.type';
import { ImportFilesSummary } from './import-report.type';
import { ATTACHMENT_SOURCES_COLLECTION, CLICKUP_FILE_HOST_SUFFIXES, FILE_PROGRESS_STEP, MAX_BUFFERED_ATTACHMENT_BYTES } from './import.constant';

export class ClickupFilesImporter {
  private readonly links: ClickupAttachmentLinks;

  constructor(
    private readonly client: ClickupReadonlyClient,
    private readonly store: LocalStore,
    private readonly objects: ImportObjectStore,
  ) {
    this.links = new ClickupAttachmentLinks(client);
  }

  static isClickupFileHost(url: string): boolean {
    const host = new URL(url).hostname;
    return CLICKUP_FILE_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
  }

  async run(log: (message: string) => void, onProgress?: (summary: ImportFilesSummary) => void): Promise<ImportFilesSummary> {
    await this.objects.ensureBucket();
    const sources = await this.store.find(ATTACHMENT_SOURCES_COLLECTION);
    const summary: ImportFilesSummary = { total: sources.length, downloaded: 0, alreadyStored: 0, failed: 0, bytesStored: 0, bytesDeclared: sources.reduce((sum, s) => sum + Number(s.size ?? 0), 0), failures: [] };
    const byTask = new Map<string, any[]>();
    for (const source of sources) byTask.set(String(source.task_id), [...(byTask.get(String(source.task_id)) ?? []), source]);
    let done = 0;
    for (const [taskId, group] of byTask) {
      await this.copyTask(taskId, group, summary);
      const crossedStep = Math.floor((done + group.length) / FILE_PROGRESS_STEP) > Math.floor(done / FILE_PROGRESS_STEP);
      done += group.length;
      if (crossedStep) {
        log(`files: ${done}/${sources.length}, ${summary.bytesStored} bytes, ${summary.failed} failed`);
        onProgress?.(summary);
      }
    }
    return summary;
  }

  private async copyTask(taskId: string, group: any[], summary: ImportFilesSummary): Promise<void> {
    const pending: Array<{ source: any; doc: any }> = [];
    for (const source of group) {
      const id = String(source._id);
      const doc = await this.store.findById('attachments', id);
      if (!doc) {
        this.fail(summary, source, 'attachment record is missing');
        continue;
      }
      const declared = Number(source.size ?? 0);
      const stored = await this.objects.headSize(doc.storage_key);
      if (stored !== null && doc.confirmed === true && stored === (declared > 0 ? declared : Number(doc.size_bytes))) {
        summary.alreadyStored++;
        summary.bytesStored += stored;
        await this.syncComment(doc, true);
        continue;
      }
      if (doc.confirmed === true) {
        await this.store.setFields('attachments', id, { confirmed: false, size_bytes: declared });
        await this.syncComment(doc, false);
      }
      if (!ClickupFilesImporter.isClickupFileHost(source.url)) {
        this.fail(summary, source, `external link, not a ClickUp file: ${new URL(source.url).hostname}`);
        continue;
      }
      if (declared > MAX_BUFFERED_ATTACHMENT_BYTES) {
        this.fail(summary, source, `file too large to copy in memory: ${declared} bytes`);
        continue;
      }
      pending.push({ source, doc });
    }
    if (!pending.length) return;
    let links: Map<string, string>;
    try {
      links = await this.links.forTask(taskId, pending.some((p) => p.doc.comment_id));
    } catch (error) {
      for (const { source } of pending) this.fail(summary, source, `could not read a current link: ${(error as Error).message}`);
      return;
    }
    for (const { source, doc } of pending) await this.copyOne(source, doc, links.get(String(source._id)), summary);
  }

  private async copyOne(source: any, doc: any, link: string | undefined, summary: ImportFilesSummary): Promise<void> {
    if (!link) return this.fail(summary, source, 'ClickUp no longer lists this file');
    if (!ClickupFilesImporter.isClickupFileHost(link)) return this.fail(summary, source, `external link, not a ClickUp file: ${new URL(link).hostname}`);
    const declared = Number(source.size ?? 0);
    try {
      const body = await this.client.download(link);
      if (declared > 0 && body.length !== declared) return this.fail(summary, source, `downloaded ${body.length} bytes, ClickUp declares ${declared}`);
      await this.objects.put(doc.storage_key, body, doc.mime_type);
      const size = await this.objects.headSize(doc.storage_key);
      if (size !== body.length) return this.fail(summary, source, `stored ${size} bytes, downloaded ${body.length}`);
      await this.store.setFields('attachments', String(source._id), { confirmed: true, size_bytes: size });
      await this.syncComment(doc, true);
      summary.downloaded++;
      summary.bytesStored += size;
    } catch (error) {
      this.fail(summary, source, (error as Error).message);
    }
  }

  private async syncComment(doc: any, attached: boolean): Promise<void> {
    if (!doc.comment_id) return;
    const commentId = String(doc.comment_id);
    const comment = await this.store.findById('comments', commentId);
    if (!comment) return;
    const id = String(doc._id);
    const others = (comment.attachment_ids ?? []).filter((other: string) => other !== id);
    await this.store.setFields('comments', commentId, { attachment_ids: attached ? [...others, id] : others });
  }

  private fail(summary: ImportFilesSummary, source: any, reason: string): void {
    summary.failed++;
    summary.failures.push({ attachmentId: String(source._id), taskId: String(source.task_id), reason });
  }
}
