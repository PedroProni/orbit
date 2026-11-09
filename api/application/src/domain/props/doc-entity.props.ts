

export interface DocEntityProps {
  _id: string;
  workspaceId: string;
  spaceId: string | null;
  parentId: string | null;
  title: string;
  bodyMd: string;
  authorId: string;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}
