import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Workspace, WorkspaceDocument } from '@infrastructure/database/schemas/workspace.schema';
import { WorkspaceRepository } from '@domain/repositories/workspace.repository';
import { WorkspaceEntity } from '@domain/entities/workspace.entity';
import { DomainWorkspaceMapper } from '@domain/mappers/workspace.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class WorkspacePersistence extends BaseMongoPersistence<WorkspaceEntity, WorkspaceDocument> implements WorkspaceRepository {
  constructor(@InjectModel(Workspace.name) model: Model<WorkspaceDocument>) {
    super(model, DomainWorkspaceMapper.toDomain, DomainWorkspaceMapper.toPersistence);
  }
}
