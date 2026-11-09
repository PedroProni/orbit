import mongoose from 'mongoose';
import { applyInlineFiles, loadInlineFilesPlan, summarizeInlineFilesPlan } from './inline-files.runner';

const arg = (name: string): string | undefined => {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

async function main(): Promise<void> {
  const uri = arg('mongo-uri') ?? process.env.MONGODB_URI;
  if (!uri) throw new Error('Set MONGODB_URI or pass --mongo-uri');
  const doApply = process.argv.includes('--apply');
  const actorId = arg('actor');
  if (doApply && !actorId) throw new Error('--apply needs --actor <id> for the audit records');
  const connection = await mongoose.createConnection(uri).asPromise();
  try {
    if (!doApply) {
      console.log(JSON.stringify({ mode: 'dry-run', ...summarizeInlineFilesPlan(await loadInlineFilesPlan(connection)) }, null, 2));
      return;
    }
    const applied = await applyInlineFiles(connection, actorId!);
    const recheck = await loadInlineFilesPlan(connection);
    console.log(JSON.stringify({ mode: 'apply', applied: summarizeInlineFilesPlan(applied), recheck: summarizeInlineFilesPlan(recheck) }, null, 2));
  } finally {
    await connection.close();
  }
}

main().catch((error) => {
  console.error((error as Error).message);
  process.exit(1);
});
