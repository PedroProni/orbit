import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DOC_INJECT_TOKEN, SPACE_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { DocRepository } from '@domain/repositories/doc.repository';
import { SpaceRepository } from '@domain/repositories/space.repository';
import { DocEntity } from '@domain/entities/doc.entity';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { guardDomain } from '@common/helpers/functions/domain-guard.helper';
import { newId } from '@common/helpers/functions/id.helper';
import { AuditService } from '@application/services/audit.service';
import { SaveDocDto } from '@shared/dtos/doc/save-doc.dto';

@Injectable()
export class DocsUseCase {
  constructor(
    @Inject(DOC_INJECT_TOKEN) private readonly docs: DocRepository,
    @Inject(SPACE_INJECT_TOKEN) private readonly spaces: SpaceRepository,
    private readonly audit: AuditService,
  ) {}

  async list(principal: AuthPrincipal, spaceId?: string) {
    const filter: Record<string, unknown> = { workspace_id: principal.workspaceId, archived: false };
    if (spaceId) filter.space_id = spaceId;
    return (await this.docs.findMany(filter, { title: 1 })).map((d) => DocsUseCase.summary(d));
  }

  async get(principal: AuthPrincipal, id: string) {
    return DocsUseCase.full(await this.find(principal, id));
  }

  async create(principal: AuthPrincipal, dto: SaveDocDto) {
    await this.validateRefs(principal, null, dto);
    const now = new Date();
    const doc = new DocEntity({ _id: newId(), workspaceId: principal.workspaceId, spaceId: null, parentId: null, title: 'x', bodyMd: '', authorId: principal.userId, archived: false, createdAt: now, updatedAt: now });
    guardDomain(() => doc.rewrite(dto.title, dto.bodyMd, dto.spaceId ?? null, dto.parentId ?? null));
    const saved = await this.docs.create(doc);
    await this.audit.record(principal, 'doc.created', 'doc', saved.getId(), { title: saved.getTitle() });
    return DocsUseCase.full(saved);
  }

  async update(principal: AuthPrincipal, id: string, dto: SaveDocDto) {
    const doc = await this.find(principal, id);
    await this.validateRefs(principal, id, dto);
    guardDomain(() => doc.rewrite(dto.title, dto.bodyMd, dto.spaceId ?? null, dto.parentId ?? null));
    const saved = await this.docs.update(doc);
    await this.audit.record(principal, 'doc.updated', 'doc', id, {});
    return DocsUseCase.full(saved);
  }

  async archive(principal: AuthPrincipal, id: string) {
    const doc = await this.find(principal, id);
    doc.archive();
    await this.docs.update(doc);
    await this.audit.record(principal, 'doc.archived', 'doc', id, {});
  }

  private async validateRefs(principal: AuthPrincipal, selfId: string | null, dto: SaveDocDto): Promise<void> {
    if (dto.spaceId && !(await this.spaces.findByIdInWorkspace(dto.spaceId, principal.workspaceId))) throw new NotFoundException('Space not found');
    let cursor = dto.parentId ?? null;
    const seen = new Set<string>();
    while (cursor) {
      if (cursor === selfId || seen.has(cursor)) throw new BadRequestException('Doc parent would create a cycle');
      seen.add(cursor);
      const parent = await this.docs.findByIdInWorkspace(cursor, principal.workspaceId);
      if (!parent) throw new NotFoundException('Parent doc not found');
      cursor = parent.getParentId();
    }
  }

  private async find(principal: AuthPrincipal, id: string): Promise<DocEntity> {
    const doc = await this.docs.findByIdInWorkspace(id, principal.workspaceId);
    if (!doc || doc.getArchived()) throw new NotFoundException('Doc not found');
    return doc;
  }

  private static summary(d: DocEntity) {
    return { id: d.getId(), title: d.getTitle(), spaceId: d.getSpaceId(), parentId: d.getParentId(), authorId: d.getAuthorId(), updatedAt: d.getUpdatedAt() };
  }

  private static full(d: DocEntity) {
    return { ...DocsUseCase.summary(d), bodyMd: d.getBodyMd() };
  }
}
