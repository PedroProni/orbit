import { SprintKind } from '@domain/enums/list.enums';

export interface TaskListEntityProps {
  _id: string;
  workspaceId: string;
  spaceId: string;
  folderId: string | null;
  name: string;
  kind: SprintKind;
  startDate: Date | null;
  endDate: Date | null;
  order: number;
  clickupId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
