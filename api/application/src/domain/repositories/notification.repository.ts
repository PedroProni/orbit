import { NotificationEntity } from '@domain/entities/notification.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface NotificationRepository extends BaseRepository<NotificationEntity> {}
