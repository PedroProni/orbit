

export interface TaskDependencyEntityProps {
  _id: string;
  workspaceId: string;
  taskId: string;
  dependsOnId: string;
  createdAt: Date;
  updatedAt: Date;
}
