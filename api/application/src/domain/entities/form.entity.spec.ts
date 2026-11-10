import { FormEntity } from './form.entity';

describe('FormEntity', () => {
  const old = new Date('2026-01-01T00:00:00Z');
  const form = () =>
    new FormEntity({ _id: 'f1', workspaceId: 'w1', listId: 'l1', name: 'Pedidos', publicKey: 'chave-antiga', fields: [], active: true, createdBy: 'u1', createdAt: old, updatedAt: old });

  it('moves to another list and refuses an empty list', () => {
    const f = form();
    f.moveTo('l2');
    expect(f.getListId()).toBe('l2');
    expect(f.getUpdatedAt().getTime()).toBeGreaterThan(old.getTime());
    expect(() => form().moveTo('  ')).toThrow('Form list is required');
  });

  it('rotates to a new key and refuses an empty or identical key', () => {
    const f = form();
    f.rotateKey('chave-nova');
    expect(f.getPublicKey()).toBe('chave-nova');
    expect(() => form().rotateKey('')).toThrow('A new public key is required');
    expect(() => form().rotateKey('chave-antiga')).toThrow('A new public key is required');
  });

  it('transfers the form to a new owner and refuses an empty owner', () => {
    const f = form();
    f.transferTo('u2');
    expect(f.getCreatedBy()).toBe('u2');
    expect(f.toProps().createdBy).toBe('u2');
    expect(() => form().transferTo(' ')).toThrow('Form owner is required');
  });
});
