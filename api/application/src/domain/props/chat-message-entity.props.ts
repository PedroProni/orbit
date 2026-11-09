

export interface ChatMessageEntityProps {
  _id: string;
  workspaceId: string;
  channelId: string;
  authorId: string;
  bodyMd: string;
  createdAt: Date;
  updatedAt: Date;
}
