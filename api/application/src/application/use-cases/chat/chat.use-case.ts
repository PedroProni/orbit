import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CHAT_CHANNEL_INJECT_TOKEN, CHAT_MESSAGE_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { ChatChannelRepository } from '@domain/repositories/chat-channel.repository';
import { ChatMessageRepository } from '@domain/repositories/chat-message.repository';
import { ChatChannelEntity } from '@domain/entities/chat-channel.entity';
import { ChatMessageEntity } from '@domain/entities/chat-message.entity';
import { ChatChannelKind } from '@domain/enums/chat.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { guardDomain } from '@common/helpers/functions/domain-guard.helper';
import { newId } from '@common/helpers/functions/id.helper';
import { WorkspaceMembersService } from '@application/services/workspace-members.service';
import { CreateChannelDto, PostMessageDto } from '@shared/dtos/chat/chat.dto';

@Injectable()
export class ChatUseCase {
  constructor(
    @Inject(CHAT_CHANNEL_INJECT_TOKEN) private readonly channels: ChatChannelRepository,
    @Inject(CHAT_MESSAGE_INJECT_TOKEN) private readonly messages: ChatMessageRepository,
    private readonly members: WorkspaceMembersService,
  ) {}

  async listChannels(principal: AuthPrincipal) {
    const found = await this.channels.findMany({ workspace_id: principal.workspaceId, $or: [{ kind: ChatChannelKind.PUBLIC }, { member_ids: principal.userId }] }, { name: 1 });
    return found.filter((c) => c.canAccess(principal.userId)).map(ChatUseCase.channelView);
  }

  async createChannel(principal: AuthPrincipal, dto: CreateChannelDto) {
    const memberIds = [...new Set([principal.userId, ...(dto.memberIds ?? [])])];
    if (!(await this.members.allActive(principal.workspaceId, memberIds))) throw new NotFoundException('Unknown user in members');
    const now = new Date();
    const channel = new ChatChannelEntity({ _id: newId(), workspaceId: principal.workspaceId, name: 'x', kind: dto.kind, memberIds: [], createdBy: principal.userId, createdAt: now, updatedAt: now });
    guardDomain(() => channel.rewrite(dto.name, dto.kind, memberIds));
    return ChatUseCase.channelView(await this.channels.create(channel));
  }

  async listMessages(principal: AuthPrincipal, channelId: string, before?: string) {
    await this.accessible(principal, channelId);
    const filter: Record<string, unknown> = { workspace_id: principal.workspaceId, channel_id: channelId };
    if (before) filter.created_at = { $lt: new Date(before) };
    const found = await this.messages.findMany(filter, { created_at: -1 }, 50);
    return found.reverse().map(ChatUseCase.messageView);
  }

  async post(principal: AuthPrincipal, channelId: string, dto: PostMessageDto) {
    await this.accessible(principal, channelId);
    const now = new Date();
    return ChatUseCase.messageView(await this.messages.create(new ChatMessageEntity({ _id: newId(), workspaceId: principal.workspaceId, channelId, authorId: principal.userId, bodyMd: dto.bodyMd, createdAt: now, updatedAt: now })));
  }

  private async accessible(principal: AuthPrincipal, channelId: string): Promise<ChatChannelEntity> {
    const channel = await this.channels.findByIdInWorkspace(channelId, principal.workspaceId);
    if (!channel) throw new NotFoundException('Channel not found');
    if (!channel.canAccess(principal.userId)) throw new ForbiddenException('Not a member of this channel');
    return channel;
  }

  private static channelView(c: ChatChannelEntity) {
    return { id: c.getId(), name: c.getName(), kind: c.getKind(), memberIds: c.getMemberIds() };
  }

  private static messageView(m: ChatMessageEntity) {
    return { id: m.getId(), channelId: m.getChannelId(), authorId: m.getAuthorId(), bodyMd: m.getBodyMd(), createdAt: m.getCreatedAt() };
  }
}
