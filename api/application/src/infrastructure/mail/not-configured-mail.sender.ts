import { Injectable } from '@nestjs/common';
import { MailSender } from '@domain/services/mail-sender.service';

@Injectable()
export class NotConfiguredMailSender implements MailSender {
  isConfigured(): boolean {
    return false;
  }

  sendPasswordReset(): Promise<void> {
    return Promise.reject(new Error('Mail provider is not configured'));
  }
}
