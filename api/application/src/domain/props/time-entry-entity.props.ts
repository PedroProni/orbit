

export interface TimeEntryEntityProps {
  _id: string;
  workspaceId: string;
  taskId: string;
  userId: string;
  startedAt: Date;
  endedAt: Date | null;
  minutes: number;
  createdAt: Date;
  updatedAt: Date;
}
