'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  FedPolicyResponse,
  ElectionsResponse,
  EconomicEventsResponse,
  AggregatedMarketsResponse,
  HealthCheckResponse,
} from '@/types/api';

/**
 * Fetch Fed policy data
 */
export function useFedPolicyData(): UseQueryResult<FedPolicyResponse> {
  return useQuery({
    queryKey: ['fed-policy'],
    queryFn: async () => {
      const response = await fetch('/api/markets/fed-policy');
      if (!response.ok) {
        throw new Error('Failed to fetch Fed policy data');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
  });
}

/**
 * Fetch elections data
 */
export function useElectionsData(): UseQueryResult<ElectionsResponse> {
  return useQuery({
    queryKey: ['elections'],
    queryFn: async () => {
      const response = await fetch('/api/markets/elections');
      if (!response.ok) {
        throw new Error('Failed to fetch elections data');
      }
      return response.json();
    },
    staleTime: 15 * 60 * 1000, // 15 minutes (less time-sensitive)
    refetchInterval: 15 * 60 * 1000,
  });
}

/**
 * Fetch economic events data
 */
export function useEconomicData(): UseQueryResult<EconomicEventsResponse> {
  return useQuery({
    queryKey: ['economic-events'],
    queryFn: async () => {
      const response = await fetch('/api/markets/economic');
      if (!response.ok) {
        throw new Error('Failed to fetch economic data');
      }
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 10 * 60 * 1000,
  });
}

/**
 * Fetch aggregated markets data
 */
export function useAggregatedMarkets(): UseQueryResult<AggregatedMarketsResponse> {
  return useQuery({
    queryKey: ['aggregated-markets'],
    queryFn: async () => {
      const response = await fetch('/api/markets/aggregate');
      if (!response.ok) {
        throw new Error('Failed to fetch aggregated markets');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000,
  });
}

/**
 * Health check query
 */
export function useHealthCheck(): UseQueryResult<HealthCheckResponse> {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await fetch('/api/health');
      if (!response.ok) {
        throw new Error('Health check failed');
      }
      return response.json();
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000,
    retry: 1,
  });
}

/**
 * Calculate dynamic refetch interval based on event proximity
 */
export function getRefetchInterval(closeDate: Date): number {
  const now = new Date();
  const hoursUntilClose = (closeDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilClose < 24) {
    return 1 * 60 * 1000; // 1 minute for events <24 hours away
  } else if (hoursUntilClose < 7 * 24) {
    return 5 * 60 * 1000; // 5 minutes for events <7 days away
  } else if (hoursUntilClose < 30 * 24) {
    return 15 * 60 * 1000; // 15 minutes for events <30 days away
  } else {
    return 60 * 60 * 1000; // 1 hour for distant events
  }
}
