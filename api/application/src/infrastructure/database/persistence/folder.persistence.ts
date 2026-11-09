import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Folder, FolderDocument } from '@infrastructure/database/schemas/folder.schema';
import { FolderRepository } from '@domain/repositories/folder.repository';
import { FolderEntity } from '@domain/entities/folder.entity';
import { DomainFolderMapper } from '@domain/mappers/folder.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class FolderPersistence extends BaseMongoPersistence<FolderEntity, FolderDocument> implements FolderRepository {
  constructor(@InjectModel(Folder.name) model: Model<FolderDocument>) {
    super(model, DomainFolderMapper.toDomain, DomainFolderMapper.toPersistence);
  }
}
