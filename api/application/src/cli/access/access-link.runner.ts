import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Connection } from 'mongoose';
import { ACCESS_TOKEN_BYTES, INVITE_TTL_SECONDS, RESET_TTL_SECONDS } from '@domain/constants/auth.constant';
import { AuthTokenKind } from '@domain/enums/auth-token.enums';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { UserStatus } from '@domain/enums/user.enums';
import { IssuedLinkRow, IssueAccessLinksOptions } from './access-link.type';

export async function issueAccessLinks(connection: Connection, options: IssueAccessLinksOptions): Promise<IssuedLinkRow[]> {
  if (!options.all && !options.email) throw new Error('Pass --email <address> or --all');
  const filter: Record<string, unknown> = { status: UserStatus.ACTIVE };
  if (!options.all) filter.email = options.email!.trim().toLowerCase();
  const users = await connection
    .collection('users')
    .find(filter as any)
    .toArray();
  const rows: IssuedLinkRow[] = [];
  for (const user of users) {
    const hasPassword = (await connection.collection('user_credentials').countDocuments({ _id: user._id })) > 0;
    const kind = hasPassword ? AuthTokenKind.RESET : AuthTokenKind.INVITE;
    const token = randomBytes(ACCESS_TOKEN_BYTES).toString('base64url');
    const expiresAt = new Date(options.now.getTime() + (hasPassword ? RESET_TTL_SECONDS : INVITE_TTL_SECONDS) * 1000);
    await connection.collection('auth_tokens').updateMany({ user_id: user._id, kind, used_at: null } as any, { $set: { used_at: options.now } });
    await connection
      .collection('auth_tokens')
      .insertOne({
        _id: randomUUID(),
        workspace_id: user.workspace_id,
        user_id: user._id,
        kind,
        token_hash: createHash('sha256').update(token).digest('hex'),
        expires_at: expiresAt,
        used_at: null,
        created_by: null,
        created_at: options.now,
        updated_at: options.now,
      } as any);
    await connection
      .collection('audit_logs')
      .insertOne({
        _id: randomUUID(),
        workspace_id: user.workspace_id,
        actor_type: AuditActorType.SYSTEM,
        actor_id: 'issue-access-link',
        action: 'auth.access_link_generated',
        entity_type: 'user',
        entity_id: user._id,
        meta: { kind },
        created_at: options.now,
        updated_at: options.now,
      } as any);
    rows.push({ email: user.email, kind, expiresAt, link: `${options.baseUrl.replace(/\/$/, '')}/set-password#token=${token}` });
  }
  return rows;
}
