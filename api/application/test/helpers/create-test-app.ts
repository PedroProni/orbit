import { OBJECT_STORAGE_TOKEN } from '../../src/domain/constants/object-storage.constant';
import { FakeObjectStorage } from './fake-object-storage';
import { FakeGithubClient } from './fake-github.client';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { GITHUB_CLIENT_TOKEN, IDENTITY_VERIFIER_TOKEN } from '@domain/constants/inject-token.constant';

export interface TestContext {
  app: INestApplication;
  storage: FakeObjectStorage;
  github: FakeGithubClient;
  mongod: MongoMemoryServer;
  http: () => ReturnType<typeof request>;
  login: (email: string, name?: string, role?: string, workspaceSlug?: string) => Promise<{ token: string; id: string }>;
}

const fakeVerifier = {
  verify: async (idToken: string) => {
    const [email, name, verified] = idToken.split('|');
    if (!email) throw new Error('bad token');
    return { email, name: name || email, avatarUrl: null, emailVerified: verified !== 'unverified' };
  },
};

export async function createTestApp(beforeInit?: (app: INestApplication) => void): Promise<TestContext> {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('orbit_test');
  process.env.JWT_SECRET = 'test-secret';
  process.env.ALLOWED_EMAIL_DOMAIN = 'acme.test';
  process.env.ENABLE_DEV_LOGIN = 'true';
  process.env.GITHUB_WEBHOOK_SECRET = 'whsec-test';
  process.env.SWAGGER_AUTH_USERNAME = 'admin';
  process.env.SWAGGER_AUTH_PASSWORD = 'admin';
  process.env.SCHEDULER_INTERVAL_MS = '0';
  process.env.GITHUB_SYNC_INTERVAL_MS = '0';
  const storage = new FakeObjectStorage();
  const github = new FakeGithubClient();
  const { AppModule } = await import('../../src/app.module');
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(IDENTITY_VERIFIER_TOKEN)
    .useValue(fakeVerifier)
    .overrideProvider(OBJECT_STORAGE_TOKEN)
    .useValue(storage)
    .overrideProvider(GITHUB_CLIENT_TOKEN)
    .useValue(github)
    .compile();
  const app = moduleRef.createNestApplication({ rawBody: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  beforeInit?.(app);
  await app.init();
  const http = () => request(app.getHttpServer());
  const login = async (email: string, name = email, role?: string, workspaceSlug?: string) => {
    const res = await http().post('/auth/dev-login').send({ email, name, role, workspaceSlug }).expect(200);
    return { token: res.body.accessToken as string, id: res.body.user.id as string };
  };
  return { app, mongod, http, login, storage, github };
}

export async function closeTestApp(ctx: TestContext): Promise<void> {
  await ctx.app.close();
  await ctx.mongod.stop();
}
