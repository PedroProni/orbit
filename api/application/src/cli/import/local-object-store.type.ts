export interface LocalObjectStoreSettings {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface ImportObjectStore {
  ensureBucket(): Promise<void>;
  headSize(key: string): Promise<number | null>;
  put(key: string, body: Buffer, mimeType: string): Promise<void>;
}
