export interface ObjectStorage {
  presignUpload(key: string, mimeType: string, ttlSeconds: number): Promise<string>;
  presignDownload(key: string, filename: string, ttlSeconds: number): Promise<string>;
  put(key: string, body: Buffer, mimeType: string): Promise<void>;
  headSize(key: string): Promise<number | null>;
  remove(key: string): Promise<void>;
}
