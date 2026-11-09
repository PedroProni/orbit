import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ClickupImporter } from './clickup-importer';
import { ClickupReadonlyClient } from './clickup-readonly.client';
import { ClickupDatePolicy } from './clickup-date.policy';
import { ClickupStatusCatalog } from './clickup-status-catalog';
import { ClickupImportMapper } from './clickup-import.mapper';
import { ClickupCustomFieldMapper } from './clickup-custom-field.mapper';
import { createGetOnlyFetch } from './get-only-fetch';
import { LocalStore } from './local-store';
import { LocalObjectStore } from './local-object-store';
import { ImportObjectStore } from './local-object-store.type';
import { ImportReport } from './import-report.type';
import { DATE_ORIGINS_COLLECTION } from './import.constant';
import { StatusType } from '@domain/enums/space.enums';

const SAO_PAULO = 'America/Sao_Paulo';
const DATE_ONLY = Date.UTC(2026, 2, 10, 7, 0, 0);
const LATE_EVENING = Date.UTC(2026, 2, 11, 1, 30, 0);
const DROPDOWN = { id: 'field-kind', name: 'Item Type', type: 'drop_down', type_config: { options: [{ id: 'opt-bug', name: 'Bug', color: '#ff0000', orderindex: 0 }, { id: 'opt-epic', name: 'Epic', orderindex: 1 }] } };
const UNSUPPORTED = { id: 'field-note', name: 'Note', type: 'short_text' };

const baseTask = (id: string, listId: string, over: Record<string, unknown> = {}) => ({ id, name: `Tarefa ${id}`, status: { status: 'in development', type: 'custom', color: '#00ff00' }, list: { id: listId }, tags: [{ name: 'Back-End' }], assignees: [{ id: 1 }], watchers: [], creator: { id: 1 }, custom_fields: [], checklists: [], date_created: String(DATE_ONLY), date_updated: String(DATE_ONLY), ...over });

class FakeClickup {
  taskName = 'Tarefa A';
  brokenFiles = new Set<string>();
  linkQuery = '';
  loginPageFor = '';
  requests: string[] = [];
  downloads: string[] = [];

  private readonly routes = (): Record<string, unknown> => ({
    '/team': { teams: [{ id: 900, name: 'Time', members: [{ user: { id: 1, email: 'dona@x.test', username: 'Dona', role: 1 } }, { user: { id: 2, email: 'pessoa@x.test', username: 'Pessoa', role: 3 } }] }] },
    '/team/900/space?archived=false': { spaces: [{ id: 'sp1', name: 'Espaço', statuses: [{ status: 'backlog', type: 'open', color: '#111111' }, { status: 'in review', type: 'custom', color: '#222222' }, { status: 'deployed', type: 'done', color: '#333333' }] }] },
    '/team/900/space?archived=true': { spaces: [] },
    '/space/sp1/folder?archived=false': { folders: [{ id: 'f1', name: 'Pasta viva' }] },
    '/space/sp1/folder?archived=true': { folders: [{ id: 'f2', name: 'Pasta arquivada' }] },
    '/space/sp1/list?archived=false': { lists: [{ id: 'l0', name: 'Solta' }] },
    '/space/sp1/list?archived=true': { lists: [] },
    '/folder/f1/list?archived=false': { lists: [{ id: 'l1', name: 'Sprint 4 (4/13 - 4/26)', start_date: String(DATE_ONLY), due_date: String(LATE_EVENING), statuses: [{ status: 'stuck', type: 'custom', color: '#444444' }, { status: 'Closed', type: 'closed', color: '#555555' }] }] },
    '/folder/f1/list?archived=true': { lists: [{ id: 'l2', name: 'Lista arquivada' }] },
    '/folder/f2/list?archived=false': { lists: [] },
    '/folder/f2/list?archived=true': { lists: [{ id: 'l3', name: 'Dentro da pasta arquivada' }] },
    '/team/900/task?include_closed=true&subtasks=true&include_markdown_description=true&page=0': { tasks: [{ id: 'a' }] },
    '/list/l0/task?include_closed=true&subtasks=true&include_markdown_description=true&archived=false&page=0': { tasks: [] },
    '/list/l0/task?include_closed=true&subtasks=true&include_markdown_description=true&archived=true&page=0': { tasks: [] },
    '/list/l1/task?include_closed=true&subtasks=true&include_markdown_description=true&archived=false&page=0': { tasks: [baseTask('a', 'l1', { name: this.taskName, due_date: String(DATE_ONLY), due_date_time: false, start_date: String(LATE_EVENING), start_date_time: true, custom_fields: [{ ...DROPDOWN, value: 1 }, { ...UNSUPPORTED, value: 'texto' }], dependencies: [{ task_id: 'a', depends_on: 'b' }], markdown_description: 'Imagem https://t900.p.clickup-attachments.com/x/y.png' }), baseTask('b', 'l1', { status: { status: 'Closed', type: 'closed', color: '#555555' }, assignees: [{ id: 77 }] })] },
    '/list/l1/task?include_closed=true&subtasks=true&include_markdown_description=true&archived=true&page=0': { tasks: [baseTask('c', 'l1', { status: { status: 'shipping', type: 'custom', color: '#666666' } })] },
    '/list/l2/task?include_closed=true&subtasks=true&include_markdown_description=true&archived=false&page=0': { tasks: [baseTask('d', 'l2', { status: { status: 'stuck', type: 'custom', color: '#ff0000' } })] },
    '/list/l2/task?include_closed=true&subtasks=true&include_markdown_description=true&archived=true&page=0': { tasks: [] },
    '/list/l3/task?include_closed=true&subtasks=true&include_markdown_description=true&archived=false&page=0': { tasks: [baseTask('e', 'l3')] },
    '/list/l3/task?include_closed=true&subtasks=true&include_markdown_description=true&archived=true&page=0': { tasks: [] },
    '/list/l0/field': { fields: [] },
    '/list/l1/field': { fields: [DROPDOWN, UNSUPPORTED] },
    '/list/l2/field': { fields: [] },
    '/list/l3/field': { fields: [] },
    '/space/sp1/tag': { tags: [{ name: 'back-end' }, { name: 'sem-uso' }] },
    '/task/a/comment': { comments: [{ id: 'c1', comment_text: 'Oi', date: String(DATE_ONLY), user: { id: 1 }, reply_count: 1, comment: [{ type: 'attachment', attachment: { id: 'att-c', title: 'no comentario.txt', url: 'https://t900.p.clickup-attachments.com/c', mimetype: 'text/plain', size: 3, user: { id: 2 } } }] }] },
    '/comment/c1/reply': { comments: [{ id: 'c2', comment_text: 'Resposta', date: String(DATE_ONLY), user: { id: 2 } }] },
    '/task/b/comment': { comments: [] },
    '/task/c/comment': { comments: [] },
    '/task/d/comment': { comments: [] },
    '/task/e/comment': { comments: [] },
    '/task/a': { attachments: [{ id: 'att-c', title: 'no comentario.txt', url: 'https://t900.p.clickup-attachments.com/c', mimetype: 'text/plain', size: 3, user: { id: 2 } }, { id: 'att-1', title: 'print 1.png', url: `https://t900.p.clickup-attachments.com/1${this.linkQuery}`, mimetype: 'image/png', size: 5, user: { id: 1 } }, { id: 'att-del', title: 'apagado', url: 'https://t900.p.clickup-attachments.com/2', deleted: true }, { id: 'att-ext', title: 'drive', url: 'https://drive.example.com/9', size: 9 }] },
    '/task/b': { attachments: [] },
    '/task/c': { attachments: [] },
    '/task/d': { attachments: [] },
    '/task/e': { attachments: [] },
  });

  private readonly routesV3 = (): Record<string, unknown> => ({
    '/workspaces/900/docs?limit=100&archived=false': { docs: [{ id: 'doc1', name: 'Doc de uma página', creator: 1 }, { id: 'doc2', name: 'Doc com árvore', creator: 2 }, { id: 'doc3', name: 'Apagado', deleted: true }] },
    '/workspaces/900/docs?limit=100&archived=true': { docs: [] },
    '/workspaces/900/docs/doc1/pages?content_format=text/md&max_page_depth=-1': [{ id: 'p1', name: 'Doc de uma página', content: '# Conteúdo', pages: [] }],
    '/workspaces/900/docs/doc2/pages?content_format=text/md&max_page_depth=-1': [{ id: 'p2', name: 'Capítulo', content: 'um', creator_id: 2, pages: [{ id: 'p3', name: 'Seção', content: 'dois', creator_id: 2, pages: [] }] }, { id: 'p4', name: 'Removida', deleted: true, pages: [] }],
  });

  getRequestCount = (): number => this.requests.length;
  getDownloadCount = (): number => this.downloads.length;
  getMaxPerMinute = (): number => 1;

  get = async (path: string): Promise<unknown> => {
    this.requests.push(path);
    const body = this.routes()[path];
    if (body === undefined) throw new Error(`Unexpected request: ${path}`);
    return body;
  };

  getV3 = async (path: string): Promise<unknown> => {
    this.requests.push(path);
    const body = this.routesV3()[path];
    if (body === undefined) throw new Error(`Unexpected request: ${path}`);
    return body;
  };

  download = async (url: string): Promise<Buffer> => {
    this.downloads.push(url);
    if (this.brokenFiles.has(url)) throw new Error('file answered 403');
    if (this.loginPageFor && url.includes(this.loginPageFor)) return Buffer.from('<html>tela de login do ClickUp</html>');
    return Buffer.from(url.endsWith('/c') ? 'abc' : 'image');
  };
}

class FakeObjects implements ImportObjectStore {
  readonly objects = new Map<string, Buffer>();
  ensureBucket = async (): Promise<void> => undefined;
  headSize = async (key: string): Promise<number | null> => this.objects.get(key)?.length ?? null;
  put = async (key: string, body: Buffer): Promise<void> => {
    this.objects.set(key, body);
  };
}

describe('Cópia do ClickUp', () => {
  let mongo: MongoMemoryServer;
  let store: LocalStore;
  let clickup: FakeClickup;
  let objects: FakeObjects;
  let dbCounter = 0;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
  });

  afterAll(async () => {
    await mongo.stop();
  });

  beforeEach(async () => {
    dbCounter += 1;
    store = new LocalStore();
    await store.connect(mongo.getUri(`copy${dbCounter}`));
    clickup = new FakeClickup();
    objects = new FakeObjects();
  });

  afterEach(async () => {
    await store.close();
  });

  const copy = (phase: 'all' | 'data' | 'files' = 'all'): Promise<ImportReport> => new ClickupImporter(clickup as unknown as ClickupReadonlyClient, store, objects).run({ teamId: '900', withComments: true, phase, zone: SAO_PAULO, log: () => undefined });

  it('copia pastas, listas e tarefas arquivadas', async () => {
    const report = await copy();
    expect((await store.find('folders')).map((f) => f._id).sort()).toEqual(['f1', 'f2']);
    expect((await store.find('task_lists')).map((l) => l._id).sort()).toEqual(['l0', 'l1', 'l2', 'l3']);
    expect((await store.find('tasks')).map((t) => t._id).sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect((await store.findById('tasks', 'c')).archived).toBe(true);
    expect(report.counts['tasks']).toEqual({ fetched: 5, stored: 5 });
    expect(report.counts['lists_archived'].fetched).toBe(2);
  });

  it('leva os status do ClickUp para os sete padrão e guarda o original no relatório', async () => {
    const report = await copy();
    const space = await store.findById('spaces', 'sp1');
    expect(space.statuses.map((s: any) => s.name)).toEqual(['backlog', 'to-do', 'stuck', 'in development', 'waiting review', 'in review', 'completed']);
    expect((await store.findById('tasks', 'a')).status).toBe('in development');
    expect((await store.findById('tasks', 'b')).status).toBe('completed');
    expect((await store.findById('tasks', 'd')).status).toBe('stuck');
    expect((await store.findById('tasks', 'd')).tags).not.toContain('bloqueado');
    expect(report.statusOrigins).toContainEqual({ taskId: 'd', original: 'stuck', status: 'stuck' });
    expect(report.statusOrigins).toContainEqual({ taskId: 'b', original: 'Closed', status: 'completed' });
    expect((await store.findById('import_status_origins', 'd')).original).toBe('stuck');
    expect(report.statusMapping).toContainEqual({ original: 'stuck', status: 'stuck', tasks: 1, closest: false });
    expect(report.statusMapping).toContainEqual({ original: 'backlog', status: 'backlog', tasks: 0, closest: false });
    expect(report.counts['statuses'].stored).toBe(7);
  });

  it('nenhuma tarefa fica fora dos sete, e o status desconhecido vai para o mais próximo sem criar coluna', async () => {
    const report = await copy();
    const space = await store.findById('spaces', 'sp1');
    const names = space.statuses.map((s: any) => s.name);
    expect(names).not.toContain('shipping');
    expect((await store.findById('tasks', 'c')).status).toBe('in development');
    expect(report.mismatches.filter((m) => m.clickupId === 'c').map((m) => m.reason).join()).toContain('shipping');
    expect(report.statusMapping).toContainEqual({ original: 'shipping', status: 'in development', tasks: 1, closest: true });
    expect((await store.findById('import_status_origins', 'c')).original).toBe('shipping');
    for (const id of ['a', 'b', 'c', 'd', 'e']) expect(names).toContain((await store.findById('tasks', id)).status);
  });

  it('rodar de novo troca os status antigos pelos sete e mantém o criado no Orbit', async () => {
    await copy();
    const space = await store.findById('spaces', 'sp1');
    await store.setFields('spaces', 'sp1', { statuses: [{ name: 'backlog', color: '#111111', type: StatusType.OPEN, order: 0 }, { name: 'Done', color: '#111111', type: StatusType.DONE, order: 1 }, ...space.statuses.slice(1), { name: 'Homologação', color: '#222222', type: StatusType.REVIEW, order: 9 }] });
    await copy('data');
    const again = await store.findById('spaces', 'sp1');
    expect(again.statuses.map((s: any) => s.name)).toEqual([...['backlog', 'to-do', 'stuck', 'in development', 'waiting review', 'in review', 'completed'], 'Homologação']);
    expect(again.statuses.map((s: any) => s.order)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('marca como sprint a lista de sprint e converte as datas dela', async () => {
    const report = await copy();
    const sprint = await store.findById('task_lists', 'l1');
    expect(sprint.kind).toBe('sprint');
    expect(sprint.start_date.toISOString()).toBe('2026-03-10T12:00:00.000Z');
    expect(sprint.end_date.toISOString()).toBe('2026-03-10T12:00:00.000Z');
    expect((await store.findById('task_lists', 'l0')).kind).toBe('list');
    expect(report.counts['sprints'].fetched).toBe(1);
  });

  it('prazo sem hora vira meio-dia UTC do dia local e prazo com hora guarda o dia local e o instante', async () => {
    const report = await copy();
    const task = await store.findById('tasks', 'a');
    expect(task.due_date.toISOString()).toBe('2026-03-10T12:00:00.000Z');
    expect(task.start_date.toISOString()).toBe('2026-03-10T12:00:00.000Z');
    const origin = await store.findById(DATE_ORIGINS_COLLECTION, 'a');
    expect(origin.start.instant.toISOString()).toBe('2026-03-11T01:30:00.000Z');
    expect(origin.start.has_time).toBe(true);
    expect(origin.start.local_day).toBe('2026-03-10');
    expect(origin.due.has_time).toBe(false);
    expect(report.dateOrigins).toEqual(expect.arrayContaining([{ taskId: 'a', field: 'start', raw: String(LATE_EVENING), instant: '2026-03-11T01:30:00.000Z', hasTime: true, localDay: '2026-03-10' }]));
  });

  it('copia campos suportados e relata o que o Orbit não tem', async () => {
    const report = await copy();
    expect((await store.find('custom_field_definitions')).map((f) => f._id)).toEqual(['field-kind']);
    expect((await store.findById('tasks', 'a')).custom_fields).toEqual([{ fieldId: 'field-kind', value: 'opt-epic' }]);
    expect(report.notCopied['custom_fields_unsupported'].count).toBe(1);
    expect(report.notCopied['custom_field_values'].count).toBe(1);
    expect(report.notCopied['tags_without_tasks'].count).toBe(1);
    expect(report.notCopied['inline_file_links'].count).toBe(1);
  });

  it('copia comentários, respostas, dependências e cria um usuário desativado para quem saiu do time', async () => {
    await copy();
    expect((await store.find('comments')).map((c) => c._id).sort()).toEqual(['c1', 'c2']);
    expect((await store.find('task_dependencies')).map((d) => d._id)).toEqual(['a:b']);
    const stub = (await store.find('users', { clickup_id: '77' }))[0];
    expect(stub.status).toBe('disabled');
  });

  it('copia docs com uma página e com árvore, sem os apagados', async () => {
    const report = await copy();
    const docs = await store.find('docs');
    expect(docs.map((d) => d._id).sort()).toEqual(['doc1', 'doc2', 'p2', 'p3']);
    expect(docs.find((d) => d._id === 'doc1').body_md).toBe('# Conteúdo');
    expect(docs.find((d) => d._id === 'p3').parent_id).toBe('p2');
    expect(docs.find((d) => d._id === 'p2').parent_id).toBe('doc2');
    expect(report.counts['docs'].fetched).toBe(2);
    expect(report.counts['doc_pages'].fetched).toBe(3);
  });

  it('guarda anexos no armazenamento local, inclusive o do comentário, e relata link externo', async () => {
    const report = await copy();
    expect((await store.findById('attachments', 'att-1')).confirmed).toBe(true);
    expect((await store.findById('attachments', 'att-c')).comment_id).toBe('c1');
    expect(await store.findById('attachments', 'att-del')).toBeNull();
    expect((await store.findById('attachments', 'att-ext')).confirmed).toBe(false);
    expect(objects.objects.size).toBe(2);
    expect(report.files).toMatchObject({ total: 3, downloaded: 2, failed: 1, bytesStored: 8 });
    expect(report.files?.failures[0].reason).toContain('drive.example.com');
    expect(clickup.downloads).not.toContain('https://drive.example.com/9');
  });

  it('a fase de dados não baixa arquivos e anexo sem arquivo não fica confirmado', async () => {
    await copy('data');
    expect(clickup.downloads).toEqual([]);
    expect((await store.findById('attachments', 'att-1')).confirmed).toBe(false);
  });

  it('rodar de novo não duplica nada e atualiza o que mudou no ClickUp', async () => {
    await copy();
    const collections = ['users', 'spaces', 'folders', 'task_lists', 'tasks', 'comments', 'docs', 'attachments', 'custom_field_definitions', 'task_dependencies'];
    const before = await Promise.all(collections.map((c) => store.count(c)));
    clickup.taskName = 'Tarefa A renomeada';
    await copy();
    expect(await Promise.all(collections.map((c) => store.count(c)))).toEqual(before);
    expect((await store.findById('tasks', 'a')).title).toBe('Tarefa A renomeada');
  });

  it('rodar de novo mantém papel de usuário e regras do espaço ajustados no Orbit, e tarefa criada no Orbit', async () => {
    await copy();
    const [pessoa] = await store.find('users', { clickup_id: '2' });
    await store.setFields('users', pessoa._id, { role: 'admin' });
    await store.setFields('spaces', 'sp1', { required_tags: ['p4t'], title_prefixes: ['[P4T]'], next_task_seq: 42 });
    await store.upsert('tasks', [{ _id: 'orbit-only', workspace_id: '900', clickup_id: null, title: 'Criada no Orbit' }]);
    await copy();
    expect((await store.findById('users', pessoa._id)).role).toBe('admin');
    const space = await store.findById('spaces', 'sp1');
    expect(space.required_tags).toEqual(['p4t']);
    expect(space.title_prefixes).toEqual(['[P4T]']);
    expect(space.next_task_seq).toBe(42);
    expect((await store.findById('tasks', 'orbit-only')).title).toBe('Criada no Orbit');
  });

  it('mantém o anexo ligado ao comentário quando a tarefa também o lista', async () => {
    await copy();
    expect((await store.findById('attachments', 'att-c')).comment_id).toBe('c1');
    expect((await store.findById('attachments', 'att-1')).comment_id).toBeNull();
    expect((await store.findById('comments', 'c1')).attachment_ids).toEqual(['att-c']);
  });

  it('rodar a fase de dados de novo não perde a ligação com o comentário', async () => {
    await copy();
    await copy('data');
    expect((await store.findById('attachments', 'att-c')).comment_id).toBe('c1');
    expect((await store.findById('attachments', 'att-c')).confirmed).toBe(true);
    expect((await store.findById('comments', 'c1')).attachment_ids).toEqual(['att-c']);
  });

  it('liga ao comentário o arquivo que já estava guardado', async () => {
    await copy();
    await store.setFields('comments', 'c1', { attachment_ids: [] });
    clickup.downloads = [];
    await copy('files');
    expect(clickup.downloads).toEqual([]);
    expect((await store.findById('comments', 'c1')).attachment_ids).toEqual(['att-c']);
  });

  it('tira do comentário o arquivo errado que não pôde ser baixado de novo', async () => {
    await copy();
    const attachment = await store.findById('attachments', 'att-c');
    objects.objects.set(attachment.storage_key, Buffer.from('tela de login'));
    clickup.brokenFiles.add('https://t900.p.clickup-attachments.com/c');
    await copy('files');
    expect((await store.findById('attachments', 'att-c')).confirmed).toBe(false);
    expect((await store.findById('comments', 'c1')).attachment_ids).toEqual([]);
  });

  it('rodar de novo não baixa o arquivo que já está guardado e recupera o que falhou', async () => {
    clickup.brokenFiles.add('https://t900.p.clickup-attachments.com/1');
    const first = await copy();
    expect(first.files?.failed).toBe(2);
    expect((await store.findById('attachments', 'att-1')).confirmed).toBe(false);
    clickup.brokenFiles.clear();
    clickup.downloads = [];
    const second = await copy();
    expect(clickup.downloads).toEqual(['https://t900.p.clickup-attachments.com/1']);
    expect(second.files).toMatchObject({ downloaded: 1, alreadyStored: 1, failed: 1 });
    expect((await store.findById('attachments', 'att-1')).confirmed).toBe(true);
  });

  it('pede um link novo na hora de baixar e não guarda o token do link', async () => {
    clickup.linkQuery = '?authz_token=velho';
    await copy('data');
    const source = await store.findById('import_attachment_sources', 'att-1');
    expect(source.url).toBe('https://t900.p.clickup-attachments.com/1');
    clickup.linkQuery = '?authz_token=novo';
    clickup.requests = [];
    const report = await copy('files');
    expect(clickup.requests).toContain('/task/a');
    expect(clickup.downloads).toContain('https://t900.p.clickup-attachments.com/1?authz_token=novo');
    expect(clickup.downloads.join()).not.toContain('velho');
    expect(report.files?.downloaded).toBe(2);
  });

  it('não guarda a tela de login quando o tamanho não bate com o declarado', async () => {
    clickup.loginPageFor = 'clickup-attachments.com/1';
    const report = await copy();
    const failure = report.files?.failures.find((f) => f.attachmentId === 'att-1');
    expect(failure?.reason).toContain('ClickUp declares 5');
    const doc = await store.findById('attachments', 'att-1');
    expect(doc.confirmed).toBe(false);
    expect(objects.objects.has(doc.storage_key)).toBe(false);
  });

  it('troca o arquivo errado de uma cópia anterior ao rodar de novo', async () => {
    await copy();
    const doc = await store.findById('attachments', 'att-1');
    const wrong = Buffer.from('<html>tela de login do ClickUp</html>');
    objects.objects.set(doc.storage_key, wrong);
    await store.setFields('attachments', 'att-1', { size_bytes: wrong.length });
    clickup.downloads = [];
    const report = await copy('files');
    expect(clickup.downloads).toEqual(['https://t900.p.clickup-attachments.com/1']);
    expect(report.files).toMatchObject({ downloaded: 1, alreadyStored: 1 });
    expect(objects.objects.get(doc.storage_key)?.toString()).toBe('image');
    expect((await store.findById('attachments', 'att-1')).size_bytes).toBe(5);
  });

  it('deixa o arquivo errado sem confirmar quando o novo download falha', async () => {
    await copy();
    const doc = await store.findById('attachments', 'att-1');
    objects.objects.set(doc.storage_key, Buffer.from('<html>tela de login do ClickUp</html>'));
    clickup.brokenFiles.add('https://t900.p.clickup-attachments.com/1');
    const report = await copy('files');
    expect(report.files?.failures.map((f) => f.attachmentId)).toContain('att-1');
    expect((await store.findById('attachments', 'att-1')).confirmed).toBe(false);
  });
});

describe('ClickupDatePolicy', () => {
  it('usa o dia do fuso do workspace, não o dia UTC', () => {
    expect(ClickupDatePolicy.resolve(LATE_EVENING, false, SAO_PAULO)?.day.toISOString()).toBe('2026-03-10T12:00:00.000Z');
    expect(ClickupDatePolicy.resolve(LATE_EVENING, false, 'UTC')?.day.toISOString()).toBe('2026-03-11T12:00:00.000Z');
  });

  it('marca como desconhecido quando o ClickUp não diz se há hora', () => {
    expect(ClickupDatePolicy.resolve(String(DATE_ONLY), undefined, SAO_PAULO)?.hasTime).toBeNull();
  });

  it.each([[null], [undefined], [''], ['abc']])('não cria data para %s', (raw) => {
    expect(ClickupDatePolicy.resolve(raw, false, SAO_PAULO)).toBeNull();
  });
});

describe('ClickupStatusCatalog', () => {
  it('não repete status com caixa diferente e guarda a primeira grafia', () => {
    const catalog = new ClickupStatusCatalog();
    catalog.add({ status: 'Open' });
    catalog.add({ status: 'open' });
    catalog.add({ status: ' ' });
    expect(catalog.getEntries().map((e) => e.name)).toEqual(['Open']);
  });

  it('sempre traz os sete status, sem os antigos', () => {
    const built = ClickupStatusCatalog.build([{ name: 'deployed', color: '#222222', type: StatusType.DONE, order: 0 }]);
    expect(built.map((s) => s.name)).toEqual(['backlog', 'to-do', 'stuck', 'in development', 'waiting review', 'in review', 'completed']);
  });

  it.each([
    ['shipping', 'open', 'to-do'],
    ['shipping', 'unstarted', 'to-do'],
    ['shipping', 'done', 'completed'],
    ['shipping', 'closed', 'completed'],
    ['qa final', 'custom', 'in review'],
    ['shipping', 'custom', 'in development'],
    ['', undefined, 'to-do'],
  ])('leva %s (tipo %s) para o status mais próximo: %s', (name, type, target) => {
    expect(ClickupStatusCatalog.closest(name, type)).toBe(target);
  });
});

describe('ClickupImportMapper.closedAt', () => {
  const updated = new Date(DATE_ONLY);

  it('tarefa aberta não tem data de conclusão, mesmo que o ClickUp traga uma', () => {
    expect(ClickupImportMapper.closedAt({ date_closed: String(DATE_ONLY) }, false, updated)).toBeNull();
  });

  it('tarefa concluída usa a data de fechamento, depois a de conclusão, depois a atualização', () => {
    expect(ClickupImportMapper.closedAt({ date_closed: String(LATE_EVENING), date_done: String(DATE_ONLY) }, true, updated)).toEqual(new Date(LATE_EVENING));
    expect(ClickupImportMapper.closedAt({ date_done: String(LATE_EVENING) }, true, updated)).toEqual(new Date(LATE_EVENING));
    expect(ClickupImportMapper.closedAt({}, true, updated)).toEqual(updated);
  });
});

describe('ClickupCustomFieldMapper', () => {
  it('aceita a opção pelo id ou pela posição e recusa opção inexistente', () => {
    expect(ClickupCustomFieldMapper.value({ ...DROPDOWN, value: 'opt-bug' })).toEqual({ fieldId: 'field-kind', value: 'opt-bug' });
    expect(ClickupCustomFieldMapper.value({ ...DROPDOWN, value: 1 })).toEqual({ fieldId: 'field-kind', value: 'opt-epic' });
    expect(ClickupCustomFieldMapper.value({ ...DROPDOWN, value: 9 })).toBeNull();
  });

  it('converte data e recusa URL inválida', () => {
    expect(ClickupCustomFieldMapper.value({ id: 'd', type: 'date', value: String(DATE_ONLY) })).toEqual({ fieldId: 'd', value: '2026-03-10T07:00:00.000Z' });
    expect(ClickupCustomFieldMapper.value({ id: 'u', type: 'url', value: 'nada' })).toBeNull();
    expect(ClickupCustomFieldMapper.value({ id: 'u', type: 'url', value: 'https://a.test/x' })).toEqual({ fieldId: 'u', value: 'https://a.test/x' });
  });
});

describe('Somente leitura no ClickUp', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'orbit-copy-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('recusa %s antes de sair da máquina e registra a recusa', async (method) => {
    const transport = jest.fn();
    const log = join(dir, 'metodos.log');
    const guarded = createGetOnlyFetch(log, transport as unknown as typeof fetch);
    await expect(guarded('https://api.clickup.com/api/v2/task/1', { method } as never)).rejects.toThrow('only reads');
    expect(transport).not.toHaveBeenCalled();
    expect(readFileSync(log, 'utf8')).toContain(`REFUSED ${method}`);
  });

  it('registra método e caminho sem token nem parâmetros', async () => {
    const transport = jest.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    const log = join(dir, 'metodos.log');
    const client = new ClickupReadonlyClient('segredo-do-token', createGetOnlyFetch(log, transport as unknown as typeof fetch));
    await client.get('/team?archived=false');
    const written = readFileSync(log, 'utf8');
    expect(written).toContain('GET api.clickup.com/api/v2/team 200');
    expect(written).not.toContain('segredo-do-token');
    expect(written).not.toContain('archived');
    expect(transport.mock.calls[0][1].method).toBe('GET');
  });

  it('o cliente só expõe leituras', () => {
    const methods = Object.getOwnPropertyNames(ClickupReadonlyClient.prototype);
    expect(methods.filter((m) => /post|put|patch|delete|create|update|remove/i.test(m))).toEqual([]);
  });

  it('trata o redirecionamento do link vencido como falha, sem seguir para o login', async () => {
    const transport = jest.fn().mockResolvedValue(new Response(null, { status: 302, headers: { location: 'https://id.app.clickup.com/login' } }));
    const client = new ClickupReadonlyClient('t', createGetOnlyFetch(undefined, transport as unknown as typeof fetch));
    await expect(client.download('https://t9.p.clickup-attachments.com/a?authz_token=velho')).rejects.toThrow('file answered 302');
    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0][1].redirect).toBe('manual');
  });

  it('não envia o token para o download de arquivo', async () => {
    const transport = jest.fn().mockResolvedValue(new Response('abc', { status: 200 }));
    const client = new ClickupReadonlyClient('segredo-do-token', createGetOnlyFetch(undefined, transport as unknown as typeof fetch));
    expect((await client.download('https://t9.p.clickup-attachments.com/a')).toString()).toBe('abc');
    expect(JSON.stringify(transport.mock.calls[0][1])).not.toContain('segredo-do-token');
  });

  it.each(['mongodb+srv://x:y@cluster.mongodb.net/orbit', 'mongodb://10.0.0.1:27017/orbit'])('recusa banco fora da máquina: %s', (uri) => {
    expect(() => LocalStore.assertLocal(uri.replace('+srv', ''))).toThrow('non-local');
  });

  it.each(['https://s3.amazonaws.com', 'http://10.0.0.1:9000'])('recusa armazenamento fora da máquina: %s', (endpoint) => {
    expect(() => LocalObjectStore.assertLocal(endpoint)).toThrow('non-local');
  });
});
