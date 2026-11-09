import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Doc, DocDocument } from '@infrastructure/database/schemas/doc.schema';
import { DocRepository } from '@domain/repositories/doc.repository';
import { DocEntity } from '@domain/entities/doc.entity';
import { DomainDocMapper } from '@domain/mappers/doc.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class DocPersistence extends BaseMongoPersistence<DocEntity, DocDocument> implements DocRepository {
  constructor(@InjectModel(Doc.name) model: Model<DocDocument>) {
    super(model, DomainDocMapper.toDomain, DomainDocMapper.toPersistence);
  }
}
