import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Dashboard, DashboardDocument } from '@infrastructure/database/schemas/dashboard.schema';
import { DashboardRepository } from '@domain/repositories/dashboard.repository';
import { DashboardEntity } from '@domain/entities/dashboard.entity';
import { DomainDashboardMapper } from '@domain/mappers/dashboard.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class DashboardPersistence extends BaseMongoPersistence<DashboardEntity, DashboardDocument> implements DashboardRepository {
  constructor(@InjectModel(Dashboard.name) model: Model<DashboardDocument>) {
    super(model, DomainDashboardMapper.toDomain, DomainDashboardMapper.toPersistence);
  }
}
