import { CreateBucketCommand, HeadBucketCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { buildS3ClientConfig } from '@infrastructure/storage/s3-client-config.factory';
import { LOCAL_STORAGE_HOSTS } from './import.constant';
import { ImportObjectStore, LocalObjectStoreSettings } from './local-object-store.type';

export class LocalObjectStore implements ImportObjectStore {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(settings: LocalObjectStoreSettings) {
    LocalObjectStore.assertLocal(settings.endpoint);
    this.client = new S3Client(buildS3ClientConfig({ endpoint: settings.endpoint, region: settings.region, accessKeyId: settings.accessKeyId, secretAccessKey: settings.secretAccessKey }));
    this.bucket = settings.bucket;
  }

  static assertLocal(endpoint: string): void {
    const host = new URL(endpoint).hostname;
    if (!LOCAL_STORAGE_HOSTS.includes(host)) throw new Error(`Refusing to write to non-local storage host: ${host}`);
  }

  async ensureBucket(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }

  async headSize(key: string): Promise<number | null> {
    try {
      const head = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return head.ContentLength ?? null;
    } catch {
      return null;
    }
  }

  async put(key: string, body: Buffer, mimeType: string): Promise<void> {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: mimeType }));
  }
}
