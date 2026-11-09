import { mimeOf } from '@/components/attachments/attachments.helpers';
import { putWithProgress } from '@/lib/upload';
import { orbitService } from '@/services/orbit.service';
import { workspaceService } from '@/services/workspace.service';
import { Task } from '@/types/api.types';
import { checklistFrom, cleanItems } from './create-task.helpers';
import { CreateTaskExtraFailure, CreateTaskExtrasInput } from './create-task.types';

const settle = async (work: Array<Promise<unknown>>): Promise<boolean> => (await Promise.allSettled(work)).every((result) => result.status === 'fulfilled');

const upload = async (taskId: string, file: File): Promise<void> => {
  const mimeType = mimeOf(file);
  const request = await orbitService.requestUpload(taskId, { filename: file.name, mimeType, sizeBytes: file.size });
  await putWithProgress(request.uploadUrl, file, mimeType, () => undefined);
  await orbitService.confirmUpload(request.id);
};

export async function runCreateExtras(task: Task, input: CreateTaskExtrasInput): Promise<CreateTaskExtraFailure[]> {
  const failed: CreateTaskExtraFailure[] = [];
  const subtasks = cleanItems(input.subtasks);
  const checklist = cleanItems(input.checklist);
  if (checklist.length && !(await settle([orbitService.updateTask(task.id, { checklists: checklistFrom(input.checklistName, checklist) })]))) failed.push('checklist');
  if (subtasks.length && !(await settle(subtasks.map((title) => orbitService.createTask(input.listId, { title, parentId: task.id }))))) failed.push('subtasks');
  if (input.blockers.length && !(await settle(input.blockers.map((blocker) => workspaceService.addDependency(task.id, blocker.id))))) failed.push('dependencies');
  if (input.files.length && !(await settle(input.files.map((file) => upload(task.id, file))))) failed.push('attachments');
  return failed;
}
