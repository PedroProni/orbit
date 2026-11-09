import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { AuditLog, AuditLogDocument } from '@infrastructure/database/schemas/audit-log.schema';
import { AuditLogRepository } from '@domain/repositories/audit-log.repository';
import { AuditLogEntity } from '@domain/entities/audit-log.entity';
import { DomainAuditLogMapper } from '@domain/mappers/audit-log.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class AuditLogPersistence extends BaseMongoPersistence<AuditLogEntity, AuditLogDocument> implements AuditLogRepository {
  constructor(@InjectModel(AuditLog.name) model: Model<AuditLogDocument>) {
    super(model, DomainAuditLogMapper.toDomain, DomainAuditLogMapper.toPersistence);
  }
}
