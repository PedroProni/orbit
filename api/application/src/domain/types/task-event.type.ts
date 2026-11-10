export interface TaskEvent {
  workspaceId: string;
  type: string;
  taskId: string;
  listId: string | null;
  actorId: string;
  at: Date;
  eventId?: string;
  status?: string;
  statusChanged?: boolean;
  priority?: string | null;
  priorityChanged?: boolean;
  addedAssigneeIds?: string[];
}
