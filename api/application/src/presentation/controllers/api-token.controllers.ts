import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated } from '@infrastructure/auth/authenticated.decorator';
import { CurrentPrincipal } from '@infrastructure/auth/current-principal.decorator';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { SCOPE_TOKENS_MANAGE } from '@domain/constants/scopes.constant';
import { CreateApiTokenUseCase } from '@application/use-cases/token/create-api-token.use-case';
import { ListApiTokensUseCase } from '@application/use-cases/token/list-api-tokens.use-case';
import { RevokeApiTokenUseCase } from '@application/use-cases/token/revoke-api-token.use-case';
import { CreateApiTokenDto } from '@shared/dtos/token/create-api-token.dto';

@ApiTags('Api tokens')
@Controller('api-tokens')
export class ApiTokenController {
  constructor(
    private readonly createToken: CreateApiTokenUseCase,
    private readonly listTokens: ListApiTokensUseCase,
    private readonly revokeToken: RevokeApiTokenUseCase,
  ) {}

  @Post()
  @Authenticated(SCOPE_TOKENS_MANAGE)
  create(@CurrentPrincipal() principal: AuthPrincipal, @Body() dto: CreateApiTokenDto) {
    return this.createToken.execute(principal, dto);
  }

  @Get()
  @Authenticated(SCOPE_TOKENS_MANAGE)
  list(@CurrentPrincipal() principal: AuthPrincipal) {
    return this.listTokens.execute(principal);
  }

  @Delete(':id')
  @HttpCode(204)
  @Authenticated(SCOPE_TOKENS_MANAGE)
  async revoke(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    await this.revokeToken.execute(principal, id);
  }
}
