import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PasswordHasher } from '@domain/services/password-hasher.service';
import { ARGON2_OPTIONS } from '@infrastructure/auth/argon2.constants';

@Injectable()
export class Argon2PasswordHasher implements PasswordHasher {
  private decoy: Promise<string> | null = null;

  hash(password: string): Promise<string> {
    return argon2.hash(password, ARGON2_OPTIONS);
  }

  verify(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password).catch(() => false);
  }

  async burn(password: string): Promise<void> {
    this.decoy ??= this.hash(randomBytes(32).toString('hex'));
    await this.verify(await this.decoy, password);
  }
}
