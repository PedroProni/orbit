import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { GITHUB_PULL_REQUEST_URL_MAX_LENGTH } from '@domain/constants/github-pull-request-url.constant';

export class LinkPullRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(GITHUB_PULL_REQUEST_URL_MAX_LENGTH)
  url!: string;
}
