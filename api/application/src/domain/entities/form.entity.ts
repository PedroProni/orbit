import { FormFieldTarget } from '@domain/enums/form.enums';
import { FormField } from '@domain/types/form-field.type';
import { FormEntityProps } from '@domain/props/form-entity.props';

export class FormEntity {
  private readonly _id: string;
  private workspaceId: string;
  private listId: string;
  private name: string;
  private publicKey: string;
  private fields: FormField[];
  private active: boolean;
  private createdBy: string;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: FormEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.listId = props.listId;
    this.name = props.name;
    this.publicKey = props.publicKey;
    this.fields = props.fields;
    this.active = props.active;
    this.createdBy = props.createdBy;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  getId(): string {
    return this._id;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getListId(): string {
    return this.listId;
  }

  getName(): string {
    return this.name;
  }

  getPublicKey(): string {
    return this.publicKey;
  }

  getFields(): FormField[] {
    return this.fields;
  }

  getActive(): boolean {
    return this.active;
  }

  getCreatedBy(): string {
    return this.createdBy;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  rewrite(name: string, fields: FormField[], active: boolean): void {
    if (!name.trim()) throw new Error('Form name is required');
    if (fields.length === 0 || fields.length > 20) throw new Error('A form needs between 1 and 20 fields');
    if (fields.some((f) => !f.label.trim())) throw new Error('Every field needs a label');
    if (!fields.some((f) => f.target === FormFieldTarget.TITLE && f.required)) throw new Error('A required title field is needed');
    this.name = name.trim();
    this.fields = fields;
    this.active = active;
    this.updatedAt = new Date();
  }

  toProps(): FormEntityProps {
    return { _id: this._id, workspaceId: this.workspaceId, listId: this.listId, name: this.name, publicKey: this.publicKey, fields: this.fields, active: this.active, createdBy: this.createdBy, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
