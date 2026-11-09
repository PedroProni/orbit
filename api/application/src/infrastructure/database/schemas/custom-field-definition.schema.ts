import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { CustomFieldType } from '@domain/enums/custom-field.enums';
import { CustomFieldOption } from '@domain/types/custom-field-option.type';

export type CustomFieldDefinitionDocument = HydratedDocument<CustomFieldDefinition>;

@Schema({ collection: 'custom_field_definitions', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class CustomFieldDefinition {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String, index: true })
  space_id!: string;

  @Prop({ type: String })
  name!: string;

  @Prop({ type: String, enum: Object.values(CustomFieldType) })
  type!: CustomFieldType;

  @Prop({ type: [Object], default: [] })
  options!: CustomFieldOption[];

  @Prop({ type: [String], default: null })
  list_ids!: string[] | null;
}

export const CustomFieldDefinitionSchema = SchemaFactory.createForClass(CustomFieldDefinition);
