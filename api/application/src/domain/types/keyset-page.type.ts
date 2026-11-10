import { KeysetPosition } from '@domain/types/keyset-position.type';

export type KeysetPage<T> = { items: T[]; next: KeysetPosition | null };
