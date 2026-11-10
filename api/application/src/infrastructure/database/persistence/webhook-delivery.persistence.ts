import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { WebhookDelivery, WebhookDeliveryDocument } from '@infrastructure/database/schemas/webhook-delivery.schema';
import { WebhookDeliveryRepository } from '@domain/repositories/webhook-delivery.repository';
import { WebhookDeliveryEntity } from '@domain/entities/webhook-delivery.entity';
import { WebhookDeliveryOutcome } from '@domain/enums/webhook-delivery.enums';
import { DomainWebhookDeliveryMapper } from '@domain/mappers/webhook-delivery.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class WebhookDeliveryPersistence extends BaseMongoPersistence<WebhookDeliveryEntity, WebhookDeliveryDocument> implements WebhookDeliveryRepository {
  constructor(@InjectModel(WebhookDelivery.name) model: Model<WebhookDeliveryDocument>) {
    super(model, DomainWebhookDeliveryMapper.toDomain, DomainWebhookDeliveryMapper.toPersistence);
  }

  async finish(deliveryId: string, outcome: WebhookDeliveryOutcome, linkedTasks: number, failureCode: string | null, finishedAt: Date): Promise<boolean> {
    const result = await this.model.updateOne({ delivery_id: deliveryId, outcome: null } as any, { $set: { outcome, linked_tasks: linkedTasks, failure_code: failureCode, finished_at: finishedAt, updated_at: finishedAt } } as any).exec();
    return result.modifiedCount === 1;
  }

  async countDuplicate(deliveryId: string, at: Date): Promise<void> {
    await this.model.updateOne({ delivery_id: deliveryId } as any, { $inc: { duplicates: 1 }, $set: { updated_at: at } } as any).exec();
  }
}
