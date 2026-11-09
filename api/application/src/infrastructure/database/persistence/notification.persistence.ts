import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Notification, NotificationDocument } from '@infrastructure/database/schemas/notification.schema';
import { NotificationRepository } from '@domain/repositories/notification.repository';
import { NotificationEntity } from '@domain/entities/notification.entity';
import { DomainNotificationMapper } from '@domain/mappers/notification.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class NotificationPersistence extends BaseMongoPersistence<NotificationEntity, NotificationDocument> implements NotificationRepository {
  constructor(@InjectModel(Notification.name) model: Model<NotificationDocument>) {
    super(model, DomainNotificationMapper.toDomain, DomainNotificationMapper.toPersistence);
  }
}
