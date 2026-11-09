import { ChatChannelEntity } from '@domain/entities/chat-channel.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface ChatChannelRepository extends BaseRepository<ChatChannelEntity> {}
