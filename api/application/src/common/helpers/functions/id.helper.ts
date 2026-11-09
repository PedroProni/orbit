import { randomBytes, randomUUID } from 'node:crypto';

export function newId(): string {
  return randomUUID();
}

export function newShortId(): string {
  const digits = randomBytes(6).toString('hex');
  return `86${BigInt('0x' + digits).toString(36).padStart(8, '0').slice(0, 7)}`;
}
