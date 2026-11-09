import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateBucketCommand, DeleteObjectCommand, HeadBucketCommand, HeadObjectCommand, PutObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { EnvConfigService } from '@common/env/services/env-config.service';
import { ObjectStorage } from '@domain/types/object-storage.type';
import { buildS3ClientConfig } from '@infrastructure/storage/s3-client-config.factory';

@Injectable()
export class S3ObjectStorage implements ObjectStorage, OnModuleInit {
  private readonly logger = new Logger(S3ObjectStorage.name);
  private readonly client: S3Client;
  private readonly publicClient: S3Client;
  private readonly bucket: string;
  private readonly managesBucket: boolean;

  constructor(env: EnvConfigService) {
    const settings = { region: env.getS3Region(), accessKeyId: env.getS3AccessKey(), secretAccessKey: env.getS3SecretKey() };
    this.client = new S3Client(buildS3ClientConfig({ ...settings, endpoint: env.getS3Endpoint() }));
    this.publicClient = new S3Client(buildS3ClientConfig({ ...settings, endpoint: env.getS3PublicEndpoint() }));
    this.bucket = env.getS3Bucket();
    this.managesBucket = Boolean(env.getS3Endpoint());
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (headError) {
      if (!this.managesBucket) {
        this.logger.warn(`Bucket ${this.bucket} unavailable: ${(headError as Error).message}`);
        return;
      }
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      } catch (error) {
        this.logger.warn(`Bucket ${this.bucket} unavailable: ${(error as Error).message}`);
      }
    }
  }

  presignUpload(key: string, mimeType: string, ttlSeconds: number): Promise<string> {
    return getSignedUrl(this.publicClient, new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: mimeType }), { expiresIn: ttlSeconds });
  }

  presignDownload(key: string, filename: string, ttlSeconds: number): Promise<string> {
    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`;
    return getSignedUrl(this.publicClient, new GetObjectCommand({ Bucket: this.bucket, Key: key, ResponseContentDisposition: disposition }), { expiresIn: ttlSeconds });
  }

  async put(key: string, body: Buffer, mimeType: string): Promise<void> {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: mimeType }));
  }

  async headSize(key: string): Promise<number | null> {
    try {
      const head = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return head.ContentLength ?? null;
    } catch {
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
