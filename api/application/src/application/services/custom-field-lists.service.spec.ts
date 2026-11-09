import { BadRequestException } from '@nestjs/common';
import { CustomFieldListsService } from './custom-field-lists.service';

const setup = (found: number) => {
  const lists = { count: jest.fn().mockResolvedValue(found) };
  return { lists, service: new CustomFieldListsService(lists as never) };
};

describe('CustomFieldListsService', () => {
  it('keeps the whole space when no lists are given and asks nothing', async () => {
    const { service, lists } = setup(0);
    await expect(service.resolve('w1', 's1', null)).resolves.toBeNull();
    await expect(service.resolve('w1', 's1', undefined)).resolves.toBeNull();
    expect(lists.count).not.toHaveBeenCalled();
  });

  it('refuses an empty choice', async () => {
    const { service } = setup(0);
    await expect(service.resolve('w1', 's1', [])).rejects.toBeInstanceOf(BadRequestException);
  });

  it('removes repeats, sorts and checks every list inside the workspace and the field space', async () => {
    const { service, lists } = setup(2);
    await expect(service.resolve('w1', 's1', ['l2', 'l1', 'l2'])).resolves.toEqual(['l1', 'l2']);
    const [query] = lists.count.mock.calls[0] as [{ workspace_id: string; space_id: string; _id: { $in: string[] } }];
    expect({ workspace: query.workspace_id, space: query.space_id, ids: [...query._id.$in].sort() }).toEqual({ workspace: 'w1', space: 's1', ids: ['l1', 'l2'] });
  });

  it('refuses a list from another space or workspace', async () => {
    const { service } = setup(1);
    await expect(service.resolve('w1', 's1', ['l1', 'foreign'])).rejects.toBeInstanceOf(BadRequestException);
  });
});
