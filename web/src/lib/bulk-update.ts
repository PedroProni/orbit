import { orbitService } from '@/services/orbit.service';
import { TaskPatch } from '@/services/orbit.types';
import { BULK_CONCURRENCY } from '@/lib/bulk-update.constants';

export async function bulkUpdate(ids: string[], patch: TaskPatch, update = orbitService.updateTask): Promise<string[]> {
  const queue = [...ids];
  const failed: string[] = [];
  const worker = async (): Promise<void> => {
    for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
      try {
        await update(id, patch);
      } catch {
        failed.push(id);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(BULK_CONCURRENCY, ids.length) }, worker));
  return failed;
}
