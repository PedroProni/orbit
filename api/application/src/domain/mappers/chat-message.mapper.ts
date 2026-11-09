import { ChatMessageEntity } from '@domain/entities/chat-message.entity';

export class DomainChatMessageMapper {
  static toPersistence(entity: ChatMessageEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      channel_id: entity.getChannelId(),
      author_id: entity.getAuthorId(),
      body_md: entity.getBodyMd(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): ChatMessageEntity {
    return new ChatMessageEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      channelId: raw.channel_id,
      authorId: raw.author_id,
      bodyMd: raw.body_md,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
