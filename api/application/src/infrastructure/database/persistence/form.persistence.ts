import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Form, FormDocument } from '@infrastructure/database/schemas/form.schema';
import { FormRepository } from '@domain/repositories/form.repository';
import { FormEntity } from '@domain/entities/form.entity';
import { DomainFormMapper } from '@domain/mappers/form.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class FormPersistence extends BaseMongoPersistence<FormEntity, FormDocument> implements FormRepository {
  constructor(@InjectModel(Form.name) model: Model<FormDocument>) {
    super(model, DomainFormMapper.toDomain, DomainFormMapper.toPersistence);
  }
}
