import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LoginAttempt, LoginAttemptDocument } from '@infrastructure/database/schemas/login-attempt.schema';
import { LoginAttemptRepository } from '@domain/repositories/login-attempt.repository';
import { DUPLICATE_KEY_CODE } from '@domain/constants/mongo-error.constant';

@Injectable()
export class LoginAttemptPersistence implements LoginAttemptRepository {
  constructor(@InjectModel(LoginAttempt.name) private readonly model: Model<LoginAttemptDocument>) {}

  async hit(key: string, windowSeconds: number, now: Date): Promise<number> {
    const expiresAt = new Date(now.getTime() + windowSeconds * 1000);
    const alive = { $gt: ['$expires_at', now] };
    const update = [{ $set: { count: { $cond: [alive, { $add: ['$count', 1] }, 1] }, expires_at: { $cond: [alive, '$expires_at', expiresAt] } } }];
    const run = () => this.model.collection.findOneAndUpdate({ _id: key as any }, update, { upsert: true, returnDocument: 'after' });
    const doc = await run().catch((error: { code?: number }) => {
      if (error.code === DUPLICATE_KEY_CODE) return run();
      throw error;
    });
    return (doc?.count as number) ?? 1;
  }

  async release(key: string): Promise<void> {
    await this.model.collection.updateOne({ _id: key as any, count: { $gt: 0 } }, { $inc: { count: -1 } });
  }

  async clear(key: string): Promise<void> {
    await this.model.collection.deleteOne({ _id: key as any });
  }
}
