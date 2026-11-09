import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type GithubSyncStateDocument = HydratedDocument<GithubSyncState>;

@Schema({ collection: 'github_sync_state', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class GithubSyncState {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: Date, default: null })
  pull_cursor!: Date | null;

  @Prop({ type: Date, default: null })
  commit_cursor!: Date | null;

  @Prop({ type: Date, default: null })
  locked_until!: Date | null;

  @Prop({ type: Date, default: null })
  last_success_at!: Date | null;
}

export const GithubSyncStateSchema = SchemaFactory.createForClass(GithubSyncState);
