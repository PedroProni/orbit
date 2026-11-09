import { SprintKind } from '@domain/enums/list.enums';

export interface CreateListCommand {
  spaceId: string;
  folderId: string | null;
  name: string;
  kind: SprintKind;
  startDate: Date | null;
  endDate: Date | null;
}
