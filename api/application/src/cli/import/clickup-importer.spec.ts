import { ClickupImporter } from './clickup-importer';
import { ClickupImportMapper } from './clickup-import.mapper';
import { SpaceEntity } from '@domain/entities/space.entity';
import { DEFAULT_STATUSES } from '@domain/constants/default-statuses.constant';

type Resolver = (rawId: unknown, taskId: string, role: string, stubs: Map<string, unknown>) => string | null;

const makeResolver = (): { resolve: Resolver; importer: ClickupImporter } => {
  const importer = new ClickupImporter({} as never, {} as never);
  const resolve = (importer as unknown as { resolveUser: Resolver }).resolveUser.bind(importer);
  return { resolve, importer };
};

describe('ClickupImporter.resolveUser', () => {
  it('returns null and creates no stub for a negative id such as -3', () => {
    const { resolve } = makeResolver();
    const stubs = new Map<string, unknown>();
    expect(resolve(-3, 't1', 'checklist assignee', stubs)).toBeNull();
    expect(stubs.size).toBe(0);
  });

  it('returns null for zero, empty and missing ids', () => {
    const { resolve } = makeResolver();
    const stubs = new Map<string, unknown>();
    expect(resolve(0, 't1', 'assignee', stubs)).toBeNull();
    expect(resolve('', 't1', 'assignee', stubs)).toBeNull();
    expect(resolve('abc', 't1', 'assignee', stubs)).toBeNull();
    expect(resolve(undefined, 't1', 'assignee', stubs)).toBeNull();
    expect(resolve(null, 't1', 'assignee', stubs)).toBeNull();
    expect(stubs.size).toBe(0);
  });

  it('creates one disabled stub for an unknown positive id and reuses it', () => {
    const { resolve } = makeResolver();
    const stubs = new Map<string, unknown>();
    const first = resolve(112093130, 't1', 'creator', stubs);
    const again = resolve('112093130', 't2', 'assignee', stubs);
    expect(first).toBeTruthy();
    expect(again).toBe(first);
    expect(stubs.size).toBe(1);
  });
});

describe('ClickupImportMapper.statusAndTags', () => {
  const space = new SpaceEntity({ _id: 's1', workspaceId: 'w1', name: 'S', statuses: DEFAULT_STATUSES.map((s) => ({ ...s })), requiredTags: [], titlePrefixes: [], nextTaskSeq: 0, createdAt: new Date(), updatedAt: new Date() });

  it.each([
    ['backlog', 'backlog'], ['to-do', 'to-do'], ['Open', 'to-do'], ['stuck', 'stuck'], ['in development', 'in development'], ['in progress', 'in development'], ['waiting review', 'waiting review'], ['in review', 'in review'], ['testing', 'in review'],
    ['ready for deploy', 'completed'], ['deployed', 'completed'], ['complete', 'completed'], ['Closed', 'completed'], ['cancelled', 'completed'],
  ])('maps the ClickUp status %s to %s', (source, target) => {
    expect(ClickupImportMapper.statusAndTags(space, source, []).status).toBe(target);
  });

  it('maps cancelled to completed and adds the cancelado tag once', () => {
    expect(ClickupImportMapper.statusAndTags(space, 'cancelled', [{ name: 'Back-End' }])).toEqual({ source: 'cancelled', status: 'completed', tags: ['back-end', 'cancelado'] });
    expect(ClickupImportMapper.statusAndTags(space, 'cancelled', [{ name: 'cancelado' }]).tags).toEqual(['cancelado']);
  });

  it('keeps stuck as a status, without any tag', () => {
    expect(ClickupImportMapper.statusAndTags(space, 'stuck', [])).toEqual({ source: 'stuck', status: 'stuck', tags: [] });
  });

  it('returns no status for an unknown or empty ClickUp status', () => {
    expect(ClickupImportMapper.statusAndTags(space, 'shipping', undefined).status).toBeNull();
    expect(ClickupImportMapper.statusAndTags(space, undefined, undefined)).toEqual({ source: '', status: null, tags: [] });
  });
});
