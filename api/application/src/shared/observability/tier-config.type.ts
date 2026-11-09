import { RouteTier } from './route-tier.enum';

export interface TierConfig {
  tier: RouteTier;
  p95ThresholdMs: number;
}
