/**
 * API response types
 */

import { AggregatedOdds, FedPolicyEvent, ElectionEvent, EconomicDataEvent } from './market';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface FedPolicyResponse extends ApiResponse<FedPolicyEvent> {}

export interface ElectionsResponse extends ApiResponse<ElectionEvent[]> {}

export interface EconomicEventsResponse extends ApiResponse<EconomicDataEvent[]> {}

export interface AggregatedMarketsResponse extends ApiResponse<AggregatedOdds[]> {}

export interface HealthCheckResponse extends ApiResponse<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  sources: {
    [key: string]: {
      status: 'up' | 'down';
      latency?: number;
    };
  };
}> {}
