import { SpaceEntity } from '@domain/entities/space.entity';
import { DEFAULT_STATUSES } from '@domain/constants/default-statuses.constant';
import { newId } from '@common/helpers/functions/id.helper';

export class SpaceFactory {
  static createDefault(workspaceId: string, name: string): SpaceEntity {
    const now = new Date();
    return new SpaceEntity({ _id: newId(), workspaceId, name, statuses: DEFAULT_STATUSES.map((s) => ({ ...s })), requiredTags: [], titlePrefixes: [], nextTaskSeq: 1, createdAt: now, updatedAt: now });
  }
}
