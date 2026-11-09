export interface MailSender {
  isConfigured(): boolean;
  sendPasswordReset(email: string, token: string): Promise<void>;
}
