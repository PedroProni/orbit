import { Global, Module } from '@nestjs/common';
import { GITHUB_CLIENT_TOKEN } from '@domain/constants/inject-token.constant';
import { GithubHttpClient } from '@infrastructure/github/github-http.client';

@Global()
@Module({
  providers: [{ provide: GITHUB_CLIENT_TOKEN, useClass: GithubHttpClient }],
  exports: [GITHUB_CLIENT_TOKEN],
})
export class GithubModule {}
