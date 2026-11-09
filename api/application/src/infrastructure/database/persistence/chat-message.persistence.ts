import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ChatMessage, ChatMessageDocument } from '@infrastructure/database/schemas/chat-message.schema';
import { ChatMessageRepository } from '@domain/repositories/chat-message.repository';
import { ChatMessageEntity } from '@domain/entities/chat-message.entity';
import { DomainChatMessageMapper } from '@domain/mappers/chat-message.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class ChatMessagePersistence extends BaseMongoPersistence<ChatMessageEntity, ChatMessageDocument> implements ChatMessageRepository {
  constructor(@InjectModel(ChatMessage.name) model: Model<ChatMessageDocument>) {
    super(model, DomainChatMessageMapper.toDomain, DomainChatMessageMapper.toPersistence);
  }
}
