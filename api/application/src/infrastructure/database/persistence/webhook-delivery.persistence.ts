import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { WebhookDelivery, WebhookDeliveryDocument } from '@infrastructure/database/schemas/webhook-delivery.schema';
import { WebhookDeliveryRepository } from '@domain/repositories/webhook-delivery.repository';
import { WebhookDeliveryEntity } from '@domain/entities/webhook-delivery.entity';
import { DomainWebhookDeliveryMapper } from '@domain/mappers/webhook-delivery.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class WebhookDeliveryPersistence extends BaseMongoPersistence<WebhookDeliveryEntity, WebhookDeliveryDocument> implements WebhookDeliveryRepository {
  constructor(@InjectModel(WebhookDelivery.name) model: Model<WebhookDeliveryDocument>) {
    super(model, DomainWebhookDeliveryMapper.toDomain, DomainWebhookDeliveryMapper.toPersistence);
  }
}
