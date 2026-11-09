import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import mongoose from 'mongoose';
import { LocalStore } from '../import/local-store';
import { CustomFieldConsolidationPlanner } from './custom-field-consolidation.planner';
import { applyFieldConsolidation, fieldConsolidationFingerprint, loadFieldConsolidationInput, summarizeFieldConsolidation } from './custom-field-consolidation.runner';
import { FIELD_MIGRATION_NAME } from './custom-field-consolidation.constant';

const arg = (name: string): string | undefined => {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

async function main(): Promise<void> {
  const uri = arg('mongo-uri') ?? process.env.MONGODB_URI;
  if (!uri) throw new Error('Set MONGODB_URI or pass --mongo-uri');
  LocalStore.assertLocal(uri);
  const doApply = process.argv.includes('--apply');
  const actorId = arg('actor');
  const backupPath = arg('backup');
  if (doApply && !actorId) throw new Error('--apply needs --actor <id> for the audit records');
  if (doApply && !backupPath) throw new Error('--apply needs --backup <file.json>');
  if (backupPath && existsSync(backupPath)) throw new Error(`Backup file already exists: ${backupPath}`);
  const connection = await mongoose.createConnection(uri).asPromise();
  try {
    const { definitions, tasks } = await loadFieldConsolidationInput(connection);
    const plan = CustomFieldConsolidationPlanner.plan(definitions, tasks);
    if (backupPath) {
      mkdirSync(dirname(backupPath), { recursive: true });
      writeFileSync(
        backupPath,
        JSON.stringify({ migration: FIELD_MIGRATION_NAME, generatedAt: new Date().toISOString(), definitions, values: plan.backedUpValues, plan: summarizeFieldConsolidation(plan) }, null, 2),
      );
    }
    if (!doApply) {
      console.log(JSON.stringify({ mode: 'dry-run', ...summarizeFieldConsolidation(plan) }, null, 2));
      return;
    }
    const applied = await applyFieldConsolidation(connection, actorId!, fieldConsolidationFingerprint(plan));
    const after = await loadFieldConsolidationInput(connection);
    const recheck = CustomFieldConsolidationPlanner.plan(after.definitions, after.tasks);
    console.log(
      JSON.stringify(
        { mode: 'apply', applied: summarizeFieldConsolidation(applied), definitionsAfter: after.definitions.map(d => `${d.name} (${d._id})`), recheck: summarizeFieldConsolidation(recheck) },
        null,
        2,
      ),
    );
  } finally {
    await connection.close();
  }
}

main().catch(error => {
  console.error((error as Error).message);
  process.exit(1);
});
