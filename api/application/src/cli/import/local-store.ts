import mongoose, { Connection } from 'mongoose';
import { LOCAL_MONGO_HOSTS } from './import.constant';

export class LocalStore {
  private connection!: Connection;

  static assertLocal(uri: string): void {
    const host = new URL(uri).hostname;
    if (!LOCAL_MONGO_HOSTS.includes(host)) throw new Error(`Refusing to write to non-local database host: ${host}`);
  }

  async connect(uri: string): Promise<void> {
    LocalStore.assertLocal(uri);
    this.connection = await mongoose.createConnection(uri).asPromise();
  }

  async upsert(collection: string, docs: Record<string, any>[]): Promise<number> {
    let stored = 0;
    for (let i = 0; i < docs.length; i += 500) {
      const batch = docs.slice(i, i + 500);
      if (batch.length === 0) continue;
      await this.connection.collection(collection).bulkWrite(batch.map((doc) => ({ replaceOne: { filter: { _id: doc._id } as any, replacement: doc, upsert: true } })));
      stored += batch.length;
    }
    return stored;
  }

  count(collection: string, filter: Record<string, unknown> = {}): Promise<number> {
    return this.connection.collection(collection).countDocuments(filter);
  }

  async existingIds(collection: string, field: string): Promise<Map<string, string>> {
    const rows = await this.connection.collection(collection).find({ [field]: { $ne: null } }, { projection: { _id: 1, [field]: 1 } }).toArray();
    return new Map(rows.map((r: any) => [String(r[field]), String(r._id)]));
  }

  find(collection: string, filter: Record<string, unknown> = {}): Promise<any[]> {
    return this.connection.collection(collection).find(filter as any).toArray();
  }

  findById(collection: string, id: string): Promise<any | null> {
    return this.connection.collection(collection).findOne({ _id: id } as any);
  }

  async setFields(collection: string, id: string, fields: Record<string, unknown>): Promise<void> {
    await this.connection.collection(collection).updateOne({ _id: id } as any, { $set: fields });
  }

  async close(): Promise<void> {
    await this.connection.close();
  }
}
