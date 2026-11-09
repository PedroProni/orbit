import mongoose from 'mongoose';
import { StatusConsolidationPlanner } from './status-consolidation.planner';
import { applyStatusConsolidation, loadConsolidationInput, summarizeConsolidation } from './status-consolidation.runner';

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
      const { spaces, tasks } = await loadConsolidationInput(connection);
      console.log(JSON.stringify({ mode: 'dry-run', ...summarizeConsolidation(StatusConsolidationPlanner.plan(spaces, tasks)) }, null, 2));
      return;
    }
    const plan = await applyStatusConsolidation(connection, actorId!);
    const after = await loadConsolidationInput(connection);
    console.log(
      JSON.stringify(
        {
          mode: 'apply',
          applied: summarizeConsolidation(plan),
          auditRecords: plan.spaces.length + plan.tasks.length,
          recheck: summarizeConsolidation(StatusConsolidationPlanner.plan(after.spaces, after.tasks)),
        },
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
