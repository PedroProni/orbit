import { buildS3ClientConfig } from '@infrastructure/storage/s3-client-config.factory';

describe('buildS3ClientConfig', () => {
  it('uses only the region and the default credential chain when no endpoint is set', () => {
    const config = buildS3ClientConfig({ region: 'us-east-1', endpoint: '', accessKeyId: 'leftover', secretAccessKey: 'leftover' });
    expect(config).toEqual({ region: 'us-east-1', requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED' });
  });

  it('uses path style and static keys for an S3 compatible endpoint', () => {
    const config = buildS3ClientConfig({ region: 'us-east-1', endpoint: 'http://localhost:9000', accessKeyId: 'orbit', secretAccessKey: 'orbit-secret' });
    expect(config).toEqual({
      region: 'us-east-1',
      endpoint: 'http://localhost:9000',
      forcePathStyle: true,
      credentials: { accessKeyId: 'orbit', secretAccessKey: 'orbit-secret' },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  });

  it('keeps the default credential chain for an endpoint without keys', () => {
    const config = buildS3ClientConfig({ region: 'sa-east-1', endpoint: 'http://minio:9000', accessKeyId: '', secretAccessKey: '' });
    expect(config.credentials).toBeUndefined();
    expect(config.forcePathStyle).toBe(true);
  });
});
