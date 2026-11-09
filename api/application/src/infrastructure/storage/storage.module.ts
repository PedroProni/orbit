import { Global, Module } from '@nestjs/common';
import { OBJECT_STORAGE_TOKEN } from '@domain/constants/object-storage.constant';
import { S3ObjectStorage } from '@infrastructure/storage/s3-object.storage';

@Global()
@Module({
  providers: [{ provide: OBJECT_STORAGE_TOKEN, useClass: S3ObjectStorage }],
  exports: [OBJECT_STORAGE_TOKEN],
})
export class StorageModule {}
