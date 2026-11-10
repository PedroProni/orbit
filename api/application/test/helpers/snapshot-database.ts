import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

export async function snapshotDatabase(app: INestApplication): Promise<Record<string, string>> {
  const connection = app.get<Connection>(getConnectionToken());
  const collections = await connection.db!.collections();
  const snapshot: Record<string, string> = {};
  for (const collection of collections.sort((a, b) => a.collectionName.localeCompare(b.collectionName))) {
    snapshot[collection.collectionName] = JSON.stringify(await collection.find({}).sort({ _id: 1 }).toArray());
  }
  return snapshot;
}
