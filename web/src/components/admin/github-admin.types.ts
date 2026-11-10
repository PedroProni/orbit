import { ReactNode } from 'react';
import { WebhookDelivery } from '@/services/github-integration.types';

export interface GithubDeliveryRowProps {
  delivery: WebhookDelivery;
}

export interface ConfigCardProps {
  label: string;
  configured: boolean;
  hint: string;
}

export interface SummaryStatProps {
  label: string;
  value: ReactNode;
}
