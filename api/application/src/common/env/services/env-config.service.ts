import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEnvConfig } from '@shared/interfaces/env-config.interface';
import { GithubRepositoryPolicy } from '@domain/policies/github-repository.policy';
import { GITHUB_DEFAULT_SYNC_INTERVAL_MS } from '@domain/constants/github-sync.constant';
import { GITHUB_API_BASE_URL } from '@domain/constants/github-api.constant';
import { AUTOMATION_DATE_DEFAULT_INTERVAL_MS } from '@domain/constants/automation.constant';

@Injectable()
export class EnvConfigService implements IEnvConfig {
  constructor(private configService: ConfigService) {}
  getMongoUri(): string {
    return this.configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/orbit';
  }

  getLocalDomain(): string {
    return this.configService.get<string>('LOCAL_DOMAIN') || 'http://localhost:3000';
  }

  getMobileDomain(): string {
    return this.configService.get<string>('MOBILE_DOMAIN') || '';
  }

  getProdDomain(): string {
    return this.configService.get<string>('PROD_DOMAIN') || '';
  }

  getSwaggerUsername(): string {
    return this.configService.get<string>('SWAGGER_AUTH_USERNAME') || 'admin';
  }

  getSwaggerPassword(): string {
    return this.configService.get<string>('SWAGGER_AUTH_PASSWORD') || 'admin';
  }

  getJwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET') || '';
  }

  requireJwtSecret(): string {
    const secret = this.getJwtSecret();
    if (secret) return secret;
    if (this.configService.get<string>('NODE_ENV') === 'production') throw new Error('JWT_SECRET is required in production');
    return 'orbit-insecure-dev-secret';
  }

  isSessionCookieInsecure(): boolean {
    return this.configService.get<string>('SESSION_COOKIE_INSECURE') === 'true';
  }

  getTrustProxyHops(): number {
    const hops = Number(this.configService.get<string>('TRUST_PROXY_HOPS') ?? 0);
    return Number.isInteger(hops) && hops > 0 ? hops : 0;
  }

  getCfAccessTeamDomain(): string {
    return (this.configService.get<string>('CF_ACCESS_TEAM_DOMAIN') || '').toLowerCase();
  }

  getCfAccessAud(): string {
    return this.configService.get<string>('CF_ACCESS_AUD') || '';
  }

  getAllowedEmailDomain(): string {
    return (this.configService.get<string>('ALLOWED_EMAIL_DOMAIN') || '').toLowerCase();
  }

  isDevLoginEnabled(): boolean {
    return this.configService.get<string>('ENABLE_DEV_LOGIN') === 'true';
  }

  getGithubWebhookSecret(): string {
    return this.configService.get<string>('GITHUB_WEBHOOK_SECRET') || '';
  }

  getS3Endpoint(): string {
    return this.configService.get<string>('S3_ENDPOINT') || '';
  }

  getS3PublicEndpoint(): string {
    return this.configService.get<string>('S3_PUBLIC_ENDPOINT') || this.getS3Endpoint();
  }

  getS3Region(): string {
    return this.configService.get<string>('S3_REGION') || 'us-east-1';
  }

  getS3Bucket(): string {
    return this.configService.get<string>('S3_BUCKET') || 'orbit-files';
  }

  getS3AccessKey(): string {
    return this.configService.get<string>('S3_ACCESS_KEY') || '';
  }

  getS3SecretKey(): string {
    return this.configService.get<string>('S3_SECRET_KEY') || '';
  }

  getPresignTtlSeconds(): number {
    return Number(this.configService.get<string>('PRESIGN_TTL_SECONDS') || 300);
  }

  getSchedulerIntervalMs(): number {
    return Number(this.configService.get<string>('SCHEDULER_INTERVAL_MS') ?? 60000);
  }

  getGithubToken(): string {
    return (this.configService.get<string>('GITHUB_TOKEN') || '').trim();
  }

  getGithubRepositories(): string[] {
    return GithubRepositoryPolicy.parseList(this.configService.get<string>('GITHUB_REPOSITORIES'));
  }

  getGithubSyncIntervalMs(): number {
    return Number(this.configService.get<string>('GITHUB_SYNC_INTERVAL_MS') ?? GITHUB_DEFAULT_SYNC_INTERVAL_MS);
  }

  getGithubApiUrl(): string {
    const raw = (this.configService.get<string>('GITHUB_API_URL') || '').trim();
    if (!raw) return GITHUB_API_BASE_URL;
    try {
      const url = new URL(raw);
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : GITHUB_API_BASE_URL;
    } catch {
      return GITHUB_API_BASE_URL;
    }
  }

  getAutomationSecretKey(): string {
    return (this.configService.get<string>('AUTOMATION_SECRET_KEY') || '').trim();
  }

  getAutomationDateIntervalMs(): number {
    return Number(this.configService.get<string>('AUTOMATION_DATE_INTERVAL_MS') ?? AUTOMATION_DATE_DEFAULT_INTERVAL_MS);
  }

  isAutomationWebhookPrivateAllowed(): boolean {
    return this.configService.get<string>('AUTOMATION_WEBHOOK_ALLOW_PRIVATE') === 'true' && this.configService.get<string>('NODE_ENV') !== 'production';
  }
}
