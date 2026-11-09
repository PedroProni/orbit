import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IdentityVerifier } from '@domain/services/identity-verifier.service';
import { VerifiedIdentity } from '@domain/types/verified-identity.type';
import { CloudflareAccessCerts } from '@domain/types/cloudflare-access-certs.type';
import { CloudflareAccessClaims } from '@domain/types/cloudflare-access-claims.type';
import { CloudflareAccessDecodedAssertion } from '@domain/types/cloudflare-access-decoded-assertion.type';
import { CF_ACCESS_CERTS_MIN_REFRESH_MS, CF_ACCESS_CERTS_PATH, CF_ACCESS_CERTS_TTL_MS, CF_ACCESS_JWT_ALGORITHM } from '@domain/constants/cloudflare-access.constant';
import { EnvConfigService } from '@common/env/services/env-config.service';

@Injectable()
export class CloudflareAccessIdentityVerifier implements IdentityVerifier {
  private certs = new Map<string, string>();
  private fetchedAt = 0;
  private pending: Promise<void> | null = null;

  constructor(
    private readonly env: EnvConfigService,
    private readonly jwt: JwtService,
  ) {}

  async verify(assertion: string): Promise<VerifiedIdentity> {
    const teamDomain = this.env.getCfAccessTeamDomain();
    const audience = this.env.getCfAccessAud();
    if (!teamDomain || !audience) throw new Error('Cloudflare Access not configured');
    const decoded = this.jwt.decode<CloudflareAccessDecodedAssertion | null>(assertion, { complete: true });
    const kid = decoded?.header?.kid;
    if (!kid) throw new Error('Assertion without key id');
    const cert = await this.certFor(teamDomain, kid);
    const claims = await this.jwt.verifyAsync<CloudflareAccessClaims>(assertion, { secret: cert, algorithms: [CF_ACCESS_JWT_ALGORITHM], audience, issuer: `https://${teamDomain}` });
    if (!claims.email) throw new Error('Assertion without email');
    const email = claims.email.toLowerCase();
    return { email, name: email.split('@')[0], avatarUrl: null, emailVerified: true };
  }

  private async certFor(teamDomain: string, kid: string): Promise<string> {
    const age = Date.now() - this.fetchedAt;
    const stale = age >= CF_ACCESS_CERTS_TTL_MS;
    const unknownAndRefreshable = !this.certs.has(kid) && age >= CF_ACCESS_CERTS_MIN_REFRESH_MS;
    if (stale || unknownAndRefreshable) await this.refresh(teamDomain);
    const cert = this.certs.get(kid);
    if (!cert) throw new Error('Unknown key id');
    return cert;
  }

  private refresh(teamDomain: string): Promise<void> {
    this.pending ??= this.load(teamDomain).finally(() => {
      this.pending = null;
    });
    return this.pending;
  }

  private async load(teamDomain: string): Promise<void> {
    const response = await fetch(`https://${teamDomain}${CF_ACCESS_CERTS_PATH}`);
    if (!response.ok) throw new Error(`Access certs unavailable: ${response.status}`);
    const body = (await response.json()) as CloudflareAccessCerts;
    this.certs = new Map((body.public_certs ?? []).map(entry => [entry.kid, entry.cert]));
    this.fetchedAt = Date.now();
  }
}
