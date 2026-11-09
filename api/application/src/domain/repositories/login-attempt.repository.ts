export interface LoginAttemptRepository {
  hit(key: string, windowSeconds: number, now: Date): Promise<number>;
  release(key: string): Promise<void>;
  clear(key: string): Promise<void>;
}
