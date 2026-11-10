import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Connection } from 'mongoose';
import { isEmail } from 'class-validator';
import { ACCESS_TOKEN_BYTES, INVITE_TTL_SECONDS } from '@domain/constants/auth.constant';
import { APP_NAME, DEFAULT_SPACE_NAME } from '@domain/constants/app.constant';
import { DEFAULT_STATUSES } from '@domain/constants/default-statuses.constant';
import { OWNER_BOOTSTRAP_ACTOR, OWNER_BOOTSTRAP_AUDIT_ACTION, OWNER_BOOTSTRAP_MARKER_ID, OWNER_BOOTSTRAP_WORKSPACE_SLUG, SYSTEM_MARKERS_COLLECTION } from '@domain/constants/owner-bootstrap.constant';
import { AuthTokenKind } from '@domain/enums/auth-token.enums';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { UserRole, UserStatus } from '@domain/enums/user.enums';
import { BootstrapOwnerOptions, BootstrapOwnerResult } from '@domain/types/owner-bootstrap.type';
import { DUPLICATE_KEY_CODE } from '@domain/constants/mongo-error.constant';

export async function bootstrapOwner(connection: Connection, options: BootstrapOwnerOptions): Promise<BootstrapOwnerResult> {
  const email = (options.email ?? '').trim().toLowerCase();
  if (!isEmail(email)) throw new Error('Pass a valid --email <address>');
  const name = (options.name ?? '').trim() || email;
  const users = connection.collection('users');
  if ((await users.countDocuments({ role: UserRole.OWNER })) > 0) throw new Error('An owner already exists; this command only runs on an instance without an owner');
  if ((await users.countDocuments({ email })) > 0) throw new Error('A user with this email already exists; use access:link for it');
  const markers = connection.collection(SYSTEM_MARKERS_COLLECTION);
  try {
    await markers.insertOne({ _id: OWNER_BOOTSTRAP_MARKER_ID, email, created_at: options.now } as any);
  } catch (error) {
    if ((error as { code?: number }).code === DUPLICATE_KEY_CODE) throw new Error('The owner bootstrap already ran on this instance');
    throw error;
  }
  const created: { collection: string; id: string }[] = [];
  try {
    const now = options.now;
    const workspaces = connection.collection('workspaces');
    let workspace = await workspaces.findOne({ slug: OWNER_BOOTSTRAP_WORKSPACE_SLUG });
    const createdWorkspace = !workspace;
    if (!workspace) {
      const workspaceId = randomUUID();
      await workspaces.insertOne({ _id: workspaceId, name: APP_NAME, slug: OWNER_BOOTSTRAP_WORKSPACE_SLUG, created_at: now, updated_at: now } as any);
      created.push({ collection: 'workspaces', id: workspaceId });
      const spaceId = randomUUID();
      await connection.collection('spaces').insertOne({
        _id: spaceId,
        workspace_id: workspaceId,
        name: DEFAULT_SPACE_NAME,
        statuses: DEFAULT_STATUSES.map(status => ({ ...status })),
        required_tags: [],
        title_prefixes: [],
        next_task_seq: 1,
        created_at: now,
        updated_at: now,
      } as any);
      created.push({ collection: 'spaces', id: spaceId });
      workspace = await workspaces.findOne({ _id: workspaceId } as any);
    }
    const workspaceId = String(workspace!._id);
    const userId = randomUUID();
    await users.insertOne({
      _id: userId,
      workspace_id: workspaceId,
      email,
      name,
      avatar_url: null,
      clickup_id: null,
      role: UserRole.OWNER,
      status: UserStatus.ACTIVE,
      created_at: now,
      updated_at: now,
    } as any);
    created.push({ collection: 'users', id: userId });
    const token = randomBytes(ACCESS_TOKEN_BYTES).toString('base64url');
    const expiresAt = new Date(now.getTime() + INVITE_TTL_SECONDS * 1000);
    const tokenId = randomUUID();
    await connection.collection('auth_tokens').insertOne({
      _id: tokenId,
      workspace_id: workspaceId,
      user_id: userId,
      kind: AuthTokenKind.INVITE,
      token_hash: createHash('sha256').update(token).digest('hex'),
      expires_at: expiresAt,
      used_at: null,
      created_by: null,
      created_at: now,
      updated_at: now,
    } as any);
    created.push({ collection: 'auth_tokens', id: tokenId });
    await connection.collection('audit_logs').insertOne({
      _id: randomUUID(),
      workspace_id: workspaceId,
      actor_type: AuditActorType.SYSTEM,
      actor_id: OWNER_BOOTSTRAP_ACTOR,
      action: OWNER_BOOTSTRAP_AUDIT_ACTION,
      entity_type: 'user',
      entity_id: userId,
      meta: { createdWorkspace, kind: AuthTokenKind.INVITE },
      created_at: now,
      updated_at: now,
    } as any);
    await markers.updateOne({ _id: OWNER_BOOTSTRAP_MARKER_ID } as any, { $set: { user_id: userId, workspace_id: workspaceId } });
    return { email, userId, workspaceId, createdWorkspace, expiresAt, link: `${options.baseUrl.replace(/\/$/, '')}/set-password#token=${token}` };
  } catch (error) {
    for (const row of created.reverse()) await connection.collection(row.collection).deleteOne({ _id: row.id } as any);
    await markers.deleteOne({ _id: OWNER_BOOTSTRAP_MARKER_ID } as any);
    throw error;
  }
}
