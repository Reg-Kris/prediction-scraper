import { NextResponse } from 'next/server';
import type { AggregatedMarketsResponse } from '@/types/api';
import { EventCategory, ImpactLevel, MarketSource } from '@/types/market';

export async function GET() {
  // Mock data for now - will be replaced with actual scraper implementation
  const response: AggregatedMarketsResponse = {
    success: true,
    data: [
      {
        eventId: 'fomc-meeting-dec-2025',
        event: {
          id: 'fomc-meeting-dec-2025',
          title: 'FOMC Meeting - December 2025',
          description: 'Federal Reserve policy decision',
          category: EventCategory.FED_POLICY,
          closeDate: new Date('2025-12-18'),
          tags: ['SPY', 'QQQ', 'volatility', 'fed'],
        },
        odds: [
          {
            eventId: 'fomc-meeting-dec-2025',
            source: MarketSource.CME_FEDWATCH,
            probability: 0.65,
            lastUpdated: new Date(),
          },
          {
            eventId: 'fomc-meeting-dec-2025',
            source: MarketSource.KALSHI,
            probability: 0.67,
            lastUpdated: new Date(),
            volume: 250000,
          },
          {
            eventId: 'fomc-meeting-dec-2025',
            source: MarketSource.POLYMARKET,
            probability: 0.63,
            lastUpdated: new Date(),
            volume: 500000,
          },
        ],
        aggregatedProbability: 0.65,
        confidence: 0.92,
        lastUpdated: new Date(),
        impactScore: {
          score: 95,
          level: ImpactLevel.CRITICAL,
          factors: {
            category: 90,
            proximity: 1.3,
            uncertainty: 1.1,
            volume: 1.1,
          },
        },
      },
    ],
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response);
}
