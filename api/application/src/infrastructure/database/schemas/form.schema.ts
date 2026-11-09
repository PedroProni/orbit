import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { FormField } from '@domain/types/form-field.type';

export type FormDocument = HydratedDocument<Form>;

@Schema({ collection: 'forms', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Form {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String, index: true })
  list_id!: string;

  @Prop({ type: String })
  name!: string;

  @Prop({ type: String, unique: true })
  public_key!: string;

  @Prop({ type: [Object], default: [] })
  fields!: FormField[];

  @Prop({ type: Boolean })
  active!: boolean;

  @Prop({ type: String })
  created_by!: string;
}

export const FormSchema = SchemaFactory.createForClass(Form);
