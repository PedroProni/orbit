

export interface UserGroupEntityProps {
  _id: string;
  workspaceId: string;
  name: string;
  memberIds: string[];
  createdAt: Date;
  updatedAt: Date;
}
