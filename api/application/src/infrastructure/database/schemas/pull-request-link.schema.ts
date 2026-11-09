import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { PullRequestLinkSource, PullRequestState } from '@domain/enums/pull-request-link.enums';
import { GithubChecksState } from '@domain/enums/github.enums';

export type PullRequestLinkDocument = HydratedDocument<PullRequestLink>;

@Schema({ collection: 'pull_request_links', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class PullRequestLink {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String, index: true })
  task_id!: string;

  @Prop({ type: String })
  repository!: string;

  @Prop({ type: Number })
  number!: number;

  @Prop({ type: String })
  url!: string;

  @Prop({ type: String })
  title!: string;

  @Prop({ type: String, enum: [...Object.values(PullRequestState), null], default: null })
  state!: PullRequestState | null;

  @Prop({ type: String, enum: Object.values(PullRequestLinkSource), default: PullRequestLinkSource.WEBHOOK })
  source!: PullRequestLinkSource;

  @Prop({ type: String, default: null })
  created_by!: string | null;

  @Prop({ type: String, default: null })
  author_login!: string | null;

  @Prop({ type: String, default: null })
  author_avatar_url!: string | null;

  @Prop({ type: String, default: null })
  head_ref!: string | null;

  @Prop({ type: String, default: null })
  head_sha!: string | null;

  @Prop({ type: Boolean, default: false })
  draft!: boolean;

  @Prop({ type: String, enum: [...Object.values(GithubChecksState), null], default: null })
  checks_state!: GithubChecksState | null;

  @Prop({ type: Date, default: null })
  github_updated_at!: Date | null;

  @Prop({ type: Date, default: null })
  synced_at!: Date | null;
}

export const PullRequestLinkSchema = SchemaFactory.createForClass(PullRequestLink);
PullRequestLinkSchema.index({ repository: 1, number: 1, task_id: 1 }, { unique: true });
PullRequestLinkSchema.index({ repository: 1, head_sha: 1 });
