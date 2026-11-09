export interface TaskEvent {
  workspaceId: string;
  type: string;
  taskId: string;
  listId: string | null;
  actorId: string;
  at: Date;
  status?: string;
  statusChanged?: boolean;
}
