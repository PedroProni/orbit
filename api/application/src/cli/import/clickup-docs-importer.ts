import { DocEntity } from '@domain/entities/doc.entity';
import { DomainDocMapper } from '@domain/mappers/doc.mapper';
import { ClickupReadonlyClient } from './clickup-readonly.client';
import { ClickupImportMapper } from './clickup-import.mapper';
import { LocalStore } from './local-store';
import { ImportLedger } from './import-ledger';
import { UNTITLED } from './import.constant';

export class ClickupDocsImporter {
  constructor(
    private readonly client: ClickupReadonlyClient,
    private readonly store: LocalStore,
    private readonly ledger: ImportLedger,
  ) {}

  async run(workspaceId: string, resolveAuthor: (rawId: unknown, docId: string) => string): Promise<void> {
    const raws = new Map<string, any>();
    for (const archived of [false, true]) {
      let cursor = '';
      for (let guard = 0; guard < 200; guard++) {
        const page = await this.client.getV3<{ docs: any[]; next_cursor?: string }>(`/workspaces/${workspaceId}/docs?limit=100&archived=${archived}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
        for (const doc of page.docs ?? []) if (!doc.deleted) raws.set(String(doc.id), { ...doc, archivedFlag: archived });
        if (!page.next_cursor) break;
        cursor = page.next_cursor;
      }
    }
    const docs: any[] = [];
    let pagesRead = 0;
    for (const raw of raws.values()) {
      let pages: any[] = [];
      try {
        pages = await this.client.getV3<any[]>(`/workspaces/${workspaceId}/docs/${raw.id}/pages?content_format=text/md&max_page_depth=-1`);
      } catch (error) {
        this.ledger.mismatch('doc', String(raw.id), `pages could not be read: ${(error as Error).message}`);
      }
      pagesRead += ClickupDocsImporter.countPages(pages);
      docs.push(...ClickupDocsImporter.toDocs(raw, pages, workspaceId, resolveAuthor));
    }
    this.ledger.track('docs', raws.size, raws.size);
    this.ledger.track('doc_pages', pagesRead, pagesRead);
    await this.store.upsert('docs', docs);
  }

  static countPages(pages: any[]): number {
    return (pages ?? []).reduce((sum, p) => (p.deleted ? sum : sum + 1 + ClickupDocsImporter.countPages(p.pages ?? [])), 0);
  }

  static toDocs(raw: any, pages: any[], workspaceId: string, resolveAuthor: (rawId: unknown, docId: string) => string): any[] {
    const live = (pages ?? []).filter((p) => !p.deleted);
    const only = live.length === 1 && !(live[0].pages ?? []).some((c: any) => !c.deleted) ? live[0] : null;
    const rootId = String(raw.id);
    const build = (id: string, parentId: string | null, title: unknown, body: unknown, author: unknown, created: unknown, updated: unknown): any => {
      const createdAt = ClickupImportMapper.date(created) ?? new Date();
      return DomainDocMapper.toPersistence(new DocEntity({ _id: id, workspaceId, spaceId: null, parentId, title: String(title ?? '').trim() || UNTITLED, bodyMd: String(body ?? ''), authorId: resolveAuthor(author, id), archived: raw.archivedFlag === true, createdAt, updatedAt: ClickupImportMapper.date(updated) ?? createdAt }));
    };
    const out: any[] = [build(rootId, null, raw.name, only?.content ?? '', raw.creator, raw.date_created, raw.date_updated)];
    const walk = (list: any[], parentId: string): void => {
      for (const page of list) {
        if (page.deleted) continue;
        const pageId = String(page.id) === rootId ? `${rootId}-page` : String(page.id);
        out.push(build(pageId, parentId, page.name, page.content, page.creator_id, page.date_created, page.date_updated));
        walk(page.pages ?? [], pageId);
      }
    };
    if (!only) walk(live, rootId);
    return out;
  }
}
