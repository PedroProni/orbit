import { ChatChannelEntity } from '@domain/entities/chat-channel.entity';

export class DomainChatChannelMapper {
  static toPersistence(entity: ChatChannelEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      name: entity.getName(),
      kind: entity.getKind(),
      member_ids: entity.getMemberIds(),
      created_by: entity.getCreatedBy(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): ChatChannelEntity {
    return new ChatChannelEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      name: raw.name,
      kind: raw.kind,
      memberIds: raw.member_ids ?? [],
      createdBy: raw.created_by,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
