import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { DEFAULT_WORKSPACE_ZONE, TOKEN_ENV_KEYS } from './import.constant';
import { ClickupReadonlyClient } from './clickup-readonly.client';
import { ClickupImporter } from './clickup-importer';
import { createGetOnlyFetch } from './get-only-fetch';
import { LocalStore } from './local-store';
import { LocalObjectStore } from './local-object-store';
import { ImportReport } from './import-report.type';
import { ImportPhase } from './import-options.type';

const arg = (name: string): string | undefined => {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const loadToken = (file: string): string => {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  for (const key of TOKEN_ENV_KEYS) {
    const line = lines.find((l) => l.trim().startsWith(`${key}=`));
    const value = line ? line.slice(line.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '') : '';
    if (value) return value;
  }
  throw new Error(`No token (${TOKEN_ENV_KEYS.join(' or ')}) found in ${file}`);
};

const renderReport = (report: ImportReport): string => {
  const rows = Object.entries(report.counts).map(([k, v]) => `| ${k} | ${v.fetched} | ${v.stored} |`).join('\n');
  const skipped = Object.entries(report.notCopied).map(([k, v]) => `| ${k} | ${v.count} | ${v.reason} |`).join('\n');
  const statuses = report.statusMapping.map((m) => `| ${m.original} | ${m.status}${m.closest ? ' (o mais próximo)' : ''} | ${m.tasks} |`).join('\n');
  const issues = report.mismatches.map((m) => `- ${m.entity} ${m.clickupId}: ${m.reason}`).join('\n');
  const files = report.files;
  const filesText = files ? `- Total: ${files.total}\n- Baixados agora: ${files.downloaded}\n- Já estavam guardados: ${files.alreadyStored}\n- Falhas: ${files.failed}\n- Bytes guardados: ${files.bytesStored}\n- Bytes declarados pelo ClickUp: ${files.bytesDeclared}\n${files.failures.map((f) => `- Falha ${f.attachmentId} (tarefa ${f.taskId}): ${f.reason}`).join('\n')}` : 'Ainda não rodou.';
  return `# Relatório da cópia (somente leitura no ClickUp)\n\n- Etapa: ${report.stage}\n- Início: ${report.startedAt}\n- Última atualização: ${report.finishedAt}\n- Fuso do workspace: ${report.zone}\n- Requisições à API do ClickUp: ${report.requests}\n- Downloads de arquivos: ${report.fileRequests}\n- Máximo de requisições em qualquer janela de 60s: ${report.maxRequestsInAnyMinute}\n\n| Entidade | Lidas do ClickUp | No banco local |\n| --- | --- | --- |\n${rows}\n\n## Status do ClickUp e onde ficaram\n\n| No ClickUp | No Orbit | Tarefas |\n| --- | --- | --- |\n${statuses}\n\n## Não copiado\n\n| Item | Quantidade | Motivo |\n| --- | --- | --- |\n${skipped}\n\n## Arquivos\n\n${filesText}\n\n## Divergências (${report.mismatches.length})\n\n${issues || 'Nenhuma.'}\n`;
};

const writeReport = (dir: string, report: ImportReport): void => {
  mkdirSync(dir, { recursive: true });
  const { dateOrigins, statusOrigins, ...summary } = report;
  writeFileSync(join(dir, 'report.json'), JSON.stringify(summary, null, 2));
  writeFileSync(join(dir, 'datas-originais.json'), JSON.stringify(dateOrigins, null, 1));
  writeFileSync(join(dir, 'status-originais.json'), JSON.stringify(statusOrigins, null, 1));
  writeFileSync(join(dir, 'report.md'), renderReport(report));
};

const objectStore = (): LocalObjectStore => {
  const read = (key: string): string => {
    const value = process.env[key];
    if (!value) throw new Error(`${key} is required to copy files`);
    return value;
  };
  return new LocalObjectStore({ endpoint: read('S3_ENDPOINT'), region: process.env.S3_REGION || 'us-east-1', bucket: read('S3_BUCKET'), accessKeyId: read('S3_ACCESS_KEY'), secretAccessKey: read('S3_SECRET_KEY') });
};

async function main(): Promise<void> {
  const mongoUri = arg('mongo-uri') ?? process.env.MONGODB_URI ?? 'mongodb://localhost:27017/orbit_import';
  LocalStore.assertLocal(mongoUri);
  const phase = (arg('phase') ?? 'all') as ImportPhase;
  if (!['all', 'data', 'files'].includes(phase)) throw new Error(`Unknown phase: ${phase}`);
  const objects = phase === 'data' ? undefined : objectStore();
  const token = loadToken(arg('env-file') ?? join(homedir(), 'env', 'clickup.env'));
  const store = new LocalStore();
  await store.connect(mongoUri);
  const dir = arg('report-dir') ?? join(process.cwd(), '..', 'internal', 'import-report');
  try {
    const importer = new ClickupImporter(new ClickupReadonlyClient(token, createGetOnlyFetch(arg('method-log'))), store, objects);
    const report = await importer.run({ teamId: arg('team-id'), withComments: !process.argv.includes('--no-comments'), phase, zone: arg('time-zone') ?? DEFAULT_WORKSPACE_ZONE, log: (m) => console.log(m), checkpoint: (partial) => writeReport(dir, partial) });
    writeReport(dir, report);
    console.log(JSON.stringify({ stage: report.stage, requests: report.requests, fileRequests: report.fileRequests, maxRequestsInAnyMinute: report.maxRequestsInAnyMinute, counts: report.counts, notCopied: report.notCopied, files: report.files && { ...report.files, failures: report.files.failures.length }, mismatches: report.mismatches.length }, null, 2));
  } finally {
    await store.close();
  }
}

main().catch((error) => {
  console.error((error as Error).message);
  process.exit(1);
});
