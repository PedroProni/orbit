import { Model } from 'mongoose';
import { BaseRepository } from '@domain/repositories/base.repository';
import { EntityWithId } from '@domain/types/entity-with-id.type';
import { PaginatedResult } from '@domain/repositories/paginated-result';

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
    const raw = await this.model.findOne({ _id: id, workspace_id: workspaceId } as any).lean().exec();
    return raw ? this.toDomain(raw) : null;
  }

  async findOne(filter: Record<string, unknown>): Promise<T | null> {
    const raw = await this.model.findOne(filter as any).lean().exec();
    return raw ? this.toDomain(raw) : null;
  }

  async findMany(filter: Record<string, unknown>, sort: Record<string, 1 | -1> = { created_at: -1 }, limit = 1000): Promise<T[]> {
    const rows = await this.model.find(filter as any).sort(sort).limit(limit).lean().exec();
    return rows.map((row) => this.toDomain(row));
  }

  async findPaged(filter: Record<string, unknown>, page: number, limit: number, sort: Record<string, 1 | -1> = { created_at: -1 }): Promise<PaginatedResult<T>> {
    const [rows, total] = await Promise.all([
      this.model.find(filter as any).sort(sort).skip((page - 1) * limit).limit(limit).lean().exec(),
      this.model.countDocuments(filter as any).exec(),
    ]);
    return { data: rows.map((row) => this.toDomain(row)), total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async count(filter: Record<string, unknown>): Promise<number> {
    return this.model.countDocuments(filter as any).exec();
  }

  async update(entity: T): Promise<T> {
    const updated = await this.model.findByIdAndUpdate(entity.getId(), this.toPersistence(entity) as any, { new: true }).lean().exec();
    return this.toDomain(updated as any);
  }

  async patch(entity: T, changedProps: string[]): Promise<T> {
    const full = this.toPersistence(entity);
    const set: Record<string, unknown> = { updated_at: new Date() };
    for (const prop of changedProps) {
      const key = prop.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
      if (key in full) set[key] = full[key];
    }
    const updated = await this.model.findByIdAndUpdate(entity.getId(), { $set: set } as any, { new: true }).lean().exec();
    return this.toDomain(updated as any);
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }
}
