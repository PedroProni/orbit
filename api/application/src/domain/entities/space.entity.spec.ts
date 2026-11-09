import { DEFAULT_STATUSES } from '@domain/constants/default-statuses.constant';
import { StatusType } from '@domain/enums/space.enums';
import { SpaceEntity } from './space.entity';

const space = (statuses = DEFAULT_STATUSES.map(s => ({ ...s }))) =>
  new SpaceEntity({ _id: 's1', workspaceId: 'w1', name: 'S', statuses, requiredTags: [], titlePrefixes: [], nextTaskSeq: 1, createdAt: new Date(), updatedAt: new Date() });

describe('SpaceEntity.resolveStatus', () => {
  it('keeps an exact name, fixes the case and maps legacy names', () => {
    const s = space();
    expect(s.resolveStatus('completed')).toBe('completed');
    expect(s.resolveStatus('Done')).toBe('completed');
    expect(s.resolveStatus('IN REVIEW')).toBe('in review');
    expect(s.resolveStatus('testing')).toBe('in review');
    expect(s.resolveStatus('stuck')).toBe('stuck');
    expect(s.resolveStatus('In progress')).toBe('in development');
  });

  it('refuses unknown names and aliases whose target the space does not have', () => {
    expect(space().resolveStatus('shipping')).toBeNull();
    const custom = space([
      { name: 'open', color: '#000', type: StatusType.OPEN, order: 0 },
      { name: 'closed', color: '#111', type: StatusType.CLOSED, order: 1 },
    ]);
    expect(custom.resolveStatus('waiting review')).toBeNull();
    expect(custom.resolveStatus('Closed')).toBe('closed');
  });
});
