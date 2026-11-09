import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ChatChannel, ChatChannelDocument } from '@infrastructure/database/schemas/chat-channel.schema';
import { ChatChannelRepository } from '@domain/repositories/chat-channel.repository';
import { ChatChannelEntity } from '@domain/entities/chat-channel.entity';
import { DomainChatChannelMapper } from '@domain/mappers/chat-channel.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class ChatChannelPersistence extends BaseMongoPersistence<ChatChannelEntity, ChatChannelDocument> implements ChatChannelRepository {
  constructor(@InjectModel(ChatChannel.name) model: Model<ChatChannelDocument>) {
    super(model, DomainChatChannelMapper.toDomain, DomainChatChannelMapper.toPersistence);
  }
}
