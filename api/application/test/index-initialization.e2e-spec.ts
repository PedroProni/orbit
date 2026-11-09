import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { IndexInitializer } from '../src/infrastructure/database/index-initializer.service';
import { createTestApp, closeTestApp, TestContext } from './helpers/create-test-app';

describe('Index initialization (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  }, 120000);

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  it('registers the index initializer', () => {
    expect(ctx.app.get(IndexInitializer, { strict: false })).toBeInstanceOf(IndexInitializer);
  });

  it('has the unique webhook delivery index ready as soon as the application starts', async () => {
    const connection = ctx.app.get<Connection>(getConnectionToken());
    const model = Object.values(connection.models).find((m) => m.collection.collectionName.includes('webhook'));
    const indexes = await (model as NonNullable<typeof model>).collection.indexes();
    expect(indexes.some((index) => index.unique === true && 'delivery_id' in (index.key as Record<string, unknown>))).toBe(true);
  });
});
