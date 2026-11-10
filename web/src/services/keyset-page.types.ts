export interface KeysetPage<T> {
  items: T[];
  nextCursor: string | null;
}
