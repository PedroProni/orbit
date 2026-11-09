import { WorkspaceEntityProps } from '@domain/props/workspace-entity.props';

export class WorkspaceEntity {
  private readonly _id: string;
  private name: string;
  private slug: string;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: WorkspaceEntityProps) {
    this._id = props._id;
    this.name = props.name;
    this.slug = props.slug;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  getId(): string {
    return this._id;
  }

  getName(): string {
    return this.name;
  }

  getSlug(): string {
    return this.slug;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  toProps(): WorkspaceEntityProps {
    return { _id: this._id, name: this.name, slug: this.slug, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
