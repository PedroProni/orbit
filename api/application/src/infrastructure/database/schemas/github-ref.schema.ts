import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { GithubRefKind } from '@domain/enums/github.enums';

export type GithubRefDocument = HydratedDocument<GithubRef>;

@Schema({ collection: 'github_refs', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class GithubRef {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String, index: true })
  task_id!: string;

  @Prop({ type: String })
  repository!: string;

  @Prop({ type: String, enum: Object.values(GithubRefKind) })
  kind!: GithubRefKind;

  @Prop({ type: String })
  key!: string;

  @Prop({ type: String, default: '' })
  title!: string;

  @Prop({ type: String, default: '' })
  url!: string;

  @Prop({ type: String, default: null })
  author_login!: string | null;

  @Prop({ type: Date, default: null })
  occurred_at!: Date | null;
}

export const GithubRefSchema = SchemaFactory.createForClass(GithubRef);
GithubRefSchema.index({ task_id: 1, repository: 1, kind: 1, key: 1 }, { unique: true });
GithubRefSchema.index({ repository: 1, kind: 1 });
