import { AuditLogEntity } from '@domain/entities/audit-log.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface AuditLogRepository extends BaseRepository<AuditLogEntity> {}
