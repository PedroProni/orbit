import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UpdateCustomFieldUseCase } from './update-custom-field.use-case';
import { CustomFieldDefinitionEntity } from '@domain/entities/custom-field-definition.entity';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { CustomFieldType } from '@domain/enums/custom-field.enums';
import { UserRole } from '@domain/enums/user.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';

const principal: AuthPrincipal = { workspaceId: 'w1', actorType: AuditActorType.USER, actorId: 'u1', userId: 'u1', role: UserRole.ADMIN, scopes: [] };
const field = () =>
  new CustomFieldDefinitionEntity({
    _id: 'cf1',
    workspaceId: 'w1',
    spaceId: 's1',
    name: 'Area',
    type: CustomFieldType.URL,
    options: [],
    listIds: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  });

const setup = (found: CustomFieldDefinitionEntity | null, resolved: string[] | null = ['l1']) => {
  const fields = { findByIdInWorkspace: jest.fn().mockResolvedValue(found), patch: jest.fn().mockImplementation((entity: CustomFieldDefinitionEntity) => Promise.resolve(entity)) };
  const fieldLists = { resolve: jest.fn().mockResolvedValue(resolved) };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  return { fields, fieldLists, audit, useCase: new UpdateCustomFieldUseCase(fields as never, fieldLists as never, audit as never) };
};

describe('UpdateCustomFieldUseCase', () => {
  it('scopes the field to the checked lists and records it', async () => {
    const { useCase, fields, fieldLists, audit } = setup(field());
    const view = await useCase.execute(principal, 'cf1', { listIds: ['l1'] });
    expect(fieldLists.resolve).toHaveBeenCalledWith('w1', 's1', ['l1']);
    expect(fields.patch).toHaveBeenCalledWith(expect.any(CustomFieldDefinitionEntity), ['listIds']);
    expect(audit.record).toHaveBeenCalledWith(principal, 'custom_field.updated', 'custom_field', 'cf1', { changed: ['listIds'], listIds: ['l1'] });
    expect(view).toEqual(expect.objectContaining({ id: 'cf1', listIds: ['l1'] }));
  });

  it('renames with a trimmed name and refuses a blank one', async () => {
    const renamed = setup(field());
    await renamed.useCase.execute(principal, 'cf1', { name: '  Figma  ' });
    expect(renamed.fields.patch).toHaveBeenCalledWith(expect.objectContaining({}), ['name']);
    const blank = setup(field());
    await expect(blank.useCase.execute(principal, 'cf1', { name: '   ' })).rejects.toBeInstanceOf(BadRequestException);
    expect(blank.fields.patch).not.toHaveBeenCalled();
  });

  it('writes nothing when nothing changes', async () => {
    const { useCase, fields, audit } = setup(field());
    await useCase.execute(principal, 'cf1', {});
    expect(fields.patch).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('answers not found for a field of another workspace', async () => {
    const { useCase, fields } = setup(null);
    await expect(useCase.execute(principal, 'cf9', { listIds: null })).rejects.toBeInstanceOf(NotFoundException);
    expect(fields.findByIdInWorkspace).toHaveBeenCalledWith('cf9', 'w1');
    expect(fields.patch).not.toHaveBeenCalled();
  });
});
