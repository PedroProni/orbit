export interface IEnvConfig {
  getMongoUri(): string;
  getAuthToken(): string;
  getDecryptToken(): string;
  getProdDomain(): string;
  getMobileDomain(): string;
  getLocalDomain(): string;
  getSwaggerUsername(): string;
  getSwaggerPassword(): string;
  getJwtSecret(): string;
  getCfAccessTeamDomain(): string;
  getCfAccessAud(): string;
  getAllowedEmailDomain(): string;
  isDevLoginEnabled(): boolean;
  requireJwtSecret(): string;
  isSessionCookieInsecure(): boolean;
  getTrustProxyHops(): number;
  getGithubWebhookSecret(): string;
  getS3Endpoint(): string;
  getS3Region(): string;
  getS3Bucket(): string;
  getS3AccessKey(): string;
  getS3SecretKey(): string;
  getPresignTtlSeconds(): number;
}
