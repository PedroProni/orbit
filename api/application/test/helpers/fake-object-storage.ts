import { ObjectStorage } from '../../src/domain/types/object-storage.type';

export class FakeObjectStorage implements ObjectStorage {
  readonly objects = new Map<string, number>();

  async presignUpload(key: string): Promise<string> {
    return `http://storage.test/upload/${key}?sig=fake`;
  }

  async presignDownload(key: string): Promise<string> {
    return `http://storage.test/download/${key}?sig=fake`;
  }

  async put(key: string, body: Buffer): Promise<void> {
    this.objects.set(key, body.length);
  }

  async headSize(key: string): Promise<number | null> {
    return this.objects.has(key) ? this.objects.get(key)! : null;
  }

  async remove(key: string): Promise<void> {
    this.objects.delete(key);
  }
}
