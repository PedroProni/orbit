import { BadRequestException } from '@nestjs/common';
import { TaskPriority } from '@domain/enums/task.enums';
import { CLICKUP_PRIORITY_BY_ID } from '@domain/constants/clickup-compat.constant';
import { CreateTaskCommand } from '@application/commands/task/create-task.command';
import { UpdateTaskCommand } from '@application/commands/task/update-task.command';

const toDate = (value: unknown): Date | null => {
  if (value === null || value === undefined || value === '') return null;
  const date = new Date(Number(value));
  if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid date');
  return date;
};

const toPriority = (value: unknown): TaskPriority | null => {
  if (value === null || value === undefined) return null;
  const name = CLICKUP_PRIORITY_BY_ID[String(value)];
  if (!name) throw new BadRequestException('Invalid priority');
  return name as TaskPriority;
};

const list = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : []);

export class ClickupInputMapper {
  static toCreate(listId: string, body: Record<string, any>, assigneeIds: string[]): CreateTaskCommand {
    if (typeof body.name !== 'string' || !body.name.trim()) throw new BadRequestException('name is required');
    return {
      listId,
      parentId: body.parent ? String(body.parent) : null,
      title: body.name,
      descriptionMd: String(body.markdown_description ?? body.description ?? ''),
      status: body.status ? String(body.status) : null,
      priority: toPriority(body.priority),
      tags: list(body.tags),
      assigneeIds,
      watcherIds: [],
      points: body.points === undefined || body.points === null ? null : Number(body.points),
      startDate: toDate(body.start_date),
      dueDate: toDate(body.due_date),
      customFields: [],
      taskKind: null,
    };
  }

  static toUpdate(body: Record<string, any>, add: string[], rem: string[]): UpdateTaskCommand {
    const command: UpdateTaskCommand = {};
    if (body.name !== undefined) command.title = String(body.name);
    if (body.markdown_description !== undefined || body.description !== undefined) command.descriptionMd = String(body.markdown_description ?? body.description ?? '');
    if (body.status !== undefined) command.status = String(body.status);
    if ('priority' in body) command.priority = toPriority(body.priority);
    if ('due_date' in body) command.dueDate = toDate(body.due_date);
    if ('start_date' in body) command.startDate = toDate(body.start_date);
    if (body.points !== undefined) command.points = body.points === null ? null : Number(body.points);
    if (body.archived !== undefined) command.archived = body.archived === true;
    if (add.length) command.addAssigneeIds = add;
    if (rem.length) command.removeAssigneeIds = rem;
    return command;
  }
}
