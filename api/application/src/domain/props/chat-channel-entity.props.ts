import { ChatChannelKind } from '@domain/enums/chat.enums';

export interface ChatChannelEntityProps {
  _id: string;
  workspaceId: string;
  name: string;
  kind: ChatChannelKind;
  memberIds: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
