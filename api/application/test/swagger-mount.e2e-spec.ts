import { createTestApp, closeTestApp, TestContext } from './helpers/create-test-app';
import { mountSwaggerAuth } from '../src/infrastructure/middlewares/mount-swagger-auth';

describe('Swagger mount does not shadow the Docs API (e2e)', () => {
  let ctx: TestContext;
  let token: string;

  beforeAll(async () => {
    ctx = await createTestApp(mountSwaggerAuth);
    token = (await ctx.login('docs@acme.test', 'Docs')).token;
  }, 120000);

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  it('serves GET /docs with a bearer token instead of the swagger basic auth wall', async () => {
    await ctx.http().get('/docs').set('Authorization', `Bearer ${token}`).expect(200);
  });

  it('protects the swagger root with basic auth', async () => {
    await ctx.http().get('/api-docs').expect(401);
  });
});
