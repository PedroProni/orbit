import { ChatMessageEntity } from '@domain/entities/chat-message.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface ChatMessageRepository extends BaseRepository<ChatMessageEntity> {}
