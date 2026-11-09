import { AuthSessionEntity } from '@domain/entities/auth-session.entity';

export class AuthSessionPresenter {
  static toView(session: AuthSessionEntity, currentId: string | undefined) {
    return {
      id: session.getId(),
      ip: session.getIp(),
      userAgent: session.getUserAgent(),
      createdAt: session.getCreatedAt(),
      expiresAt: session.getExpiresAt(),
      current: session.getId() === currentId,
    };
  }
}
