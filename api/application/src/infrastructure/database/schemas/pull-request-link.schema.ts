import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { PullRequestState } from '@domain/enums/pull-request-link.enums';

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

  @Prop({ type: String, enum: Object.values(PullRequestState) })
  state!: PullRequestState;
}

export const PullRequestLinkSchema = SchemaFactory.createForClass(PullRequestLink);
PullRequestLinkSchema.index({"repository":1,"number":1,"task_id":1}, {"unique":true});
