import { Model } from 'mongoose';
import { BaseRepository } from '@domain/repositories/base.repository';
import { EntityWithId } from '@domain/types/entity-with-id.type';
import { PaginatedResult } from '@domain/repositories/paginated-result';
import { KeysetPage } from '@domain/types/keyset-page.type';
import { KeysetPosition } from '@domain/types/keyset-position.type';
import { KeysetRow } from '@domain/types/keyset-row.type';

export abstract class BaseMongoPersistence<T extends EntityWithId, D> implements BaseRepository<T> {
  protected constructor(
    protected readonly model: Model<D>,
    protected readonly toDomain: (raw: any) => T,
    protected readonly toPersistence: (entity: T) => Record<string, unknown>,
  ) {}

  async create(entity: T): Promise<T> {
    const created = await this.model.create(this.toPersistence(entity) as any);
    return this.toDomain(created.toObject());
  }

  async findById(id: string): Promise<T | null> {
    const raw = await this.model.findById(id).lean().exec();
    return raw ? this.toDomain(raw) : null;
  }

  async findByIdInWorkspace(id: string, workspaceId: string): Promise<T | null> {
    const raw = await this.model
      .findOne({ _id: id, workspace_id: workspaceId } as any)
      .lean()
      .exec();
    return raw ? this.toDomain(raw) : null;
  }

  async findOne(filter: Record<string, unknown>): Promise<T | null> {
    const raw = await this.model
      .findOne(filter as any)
      .lean()
      .exec();
    return raw ? this.toDomain(raw) : null;
  }

  async findMany(filter: Record<string, unknown>, sort: Record<string, 1 | -1> = { created_at: -1 }, limit = 1000): Promise<T[]> {
    const rows = await this.model
      .find(filter as any)
      .sort(sort)
      .limit(limit)
      .lean()
      .exec();
    return rows.map((row) => this.toDomain(row));
  }

  async findPaged(filter: Record<string, unknown>, page: number, limit: number, sort: Record<string, 1 | -1> = { created_at: -1 }): Promise<PaginatedResult<T>> {
    const [rows, total] = await Promise.all([
      this.model
        .find(filter as any)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.model.countDocuments(filter as any).exec(),
    ]);
    return { data: rows.map((row) => this.toDomain(row)), total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findKeyset(filter: Record<string, unknown>, after: KeysetPosition | null, limit: number): Promise<KeysetPage<T>> {
    const query = after ? { $and: [filter, { $or: [{ created_at: { $lt: after.createdAt } }, { created_at: after.createdAt, _id: { $lt: after.id } }] }] } : filter;
    const rows = await this.model
      .find(query as any)
      .sort({ created_at: -1, _id: -1 })
      .limit(limit + 1)
      .lean()
      .exec();
    const page = rows.slice(0, limit) as unknown as KeysetRow[];
    const last = page[page.length - 1];
    return { items: page.map((row) => this.toDomain(row)), next: rows.length > limit && last ? { createdAt: last.created_at, id: String(last._id) } : null };
  }

  async count(filter: Record<string, unknown>): Promise<number> {
    return this.model.countDocuments(filter as any).exec();
  }

  async update(entity: T): Promise<T> {
    const updated = await this.model
      .findByIdAndUpdate(entity.getId(), this.toPersistence(entity) as any, { new: true })
      .lean()
      .exec();
    return this.toDomain(updated as any);
  }

  async patch(entity: T, changedProps: string[]): Promise<T> {
    const full = this.toPersistence(entity);
    const set: Record<string, unknown> = { updated_at: new Date() };
    for (const prop of changedProps) {
      const key = prop.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
      if (key in full) set[key] = full[key];
    }
    const updated = await this.model
      .findByIdAndUpdate(entity.getId(), { $set: set } as any, { new: true })
      .lean()
      .exec();
    return this.toDomain(updated as any);
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }
}
