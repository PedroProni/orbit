import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { PrincipalGuard } from '@infrastructure/auth/principal.guard';
import { ScopesGuard } from '@infrastructure/auth/scopes.guard';
import { ANY_SCOPES_KEY } from '@infrastructure/auth/auth.constants';

export const AuthenticatedAny = (...scopes: string[]) => applyDecorators(SetMetadata(ANY_SCOPES_KEY, scopes), UseGuards(PrincipalGuard, ScopesGuard), ApiBearerAuth());
