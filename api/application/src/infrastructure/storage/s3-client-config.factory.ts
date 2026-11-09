import { S3ClientConfig } from '@aws-sdk/client-s3';
import { S3ClientSettings } from '@domain/types/s3-client-settings.type';

export function buildS3ClientConfig(settings: S3ClientSettings): S3ClientConfig {
  const base: S3ClientConfig = { region: settings.region, requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED' };
  if (!settings.endpoint) return base;
  const credentials = settings.accessKeyId && settings.secretAccessKey ? { accessKeyId: settings.accessKeyId, secretAccessKey: settings.secretAccessKey } : undefined;
  return { ...base, endpoint: settings.endpoint, forcePathStyle: true, ...(credentials ? { credentials } : {}) };
}
