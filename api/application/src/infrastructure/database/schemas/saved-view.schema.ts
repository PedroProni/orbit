import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { SavedViewType } from '@domain/enums/saved-view.enums';
import { SavedViewFilters } from '@domain/types/saved-view-filters.type';
import { SavedViewDisplay } from '@domain/types/saved-view-display.type';

export type SavedViewDocument = HydratedDocument<SavedView>;

@Schema({ collection: 'saved_views', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class SavedView {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String, index: true })
  owner_id!: string;

  @Prop({ type: String })
  name!: string;

  @Prop({ type: String, enum: Object.values(SavedViewType) })
  view_type!: SavedViewType;

  @Prop({ type: String, default: null })
  list_id!: string | null;

  @Prop({ type: Object })
  filters!: SavedViewFilters;

  @Prop({ type: Object, default: null })
  display!: SavedViewDisplay | null;

  @Prop({ type: Boolean })
  shared!: boolean;
}

export const SavedViewSchema = SchemaFactory.createForClass(SavedView);
