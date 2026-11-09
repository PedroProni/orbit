import { CustomFieldType } from '@domain/enums/custom-field.enums';
import { CustomFieldOption } from '@domain/types/custom-field-option.type';
import { CustomFieldDefinitionEntityProps } from '@domain/props/custom-field-definition-entity.props';

export class CustomFieldDefinitionEntity {
  private readonly _id: string;
  private workspaceId: string;
  private spaceId: string;
  private name: string;
  private type: CustomFieldType;
  private options: CustomFieldOption[];
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: CustomFieldDefinitionEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.spaceId = props.spaceId;
    this.name = props.name;
    this.type = props.type;
    this.options = props.options;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  getId(): string {
    return this._id;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getSpaceId(): string {
    return this.spaceId;
  }

  getName(): string {
    return this.name;
  }

  getType(): CustomFieldType {
    return this.type;
  }

  getOptions(): CustomFieldOption[] {
    return this.options;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  rename(name: string): void {
    if (!name || name.trim().length === 0) throw new Error('Name cannot be empty');
    this.name = name.trim();
    this.updatedAt = new Date();
  }

  hasOption(optionId: string): boolean {
    return this.options.some((o) => o.id === optionId);
  }

  validateValue(value: string | number | null): void {
    if (value === null) return;
    if (this.type === CustomFieldType.DROPDOWN && !this.hasOption(String(value))) throw new Error('Invalid dropdown option');
    if (this.type === CustomFieldType.URL && !/^https?:\/\/\S+$/i.test(String(value))) throw new Error('Invalid URL');
    if (this.type === CustomFieldType.DATE && Number.isNaN(new Date(value as string | number).getTime())) throw new Error('Invalid date');
  }

  toProps(): CustomFieldDefinitionEntityProps {
    return { _id: this._id, workspaceId: this.workspaceId, spaceId: this.spaceId, name: this.name, type: this.type, options: this.options, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
