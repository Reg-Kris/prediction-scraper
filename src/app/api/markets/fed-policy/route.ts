import { NextResponse } from 'next/server';
import type { FedPolicyResponse } from '@/types/api';
import { MarketSource } from '@/types/market';

export async function GET() {
  // Mock data for now - will be replaced with actual scraper implementation
  const response: FedPolicyResponse = {
    success: true,
    data: {
      meetingDate: new Date('2025-12-18'),
      currentRate: { min: 4.5, max: 4.75 },
      probabilities: {
        noChange: 0.65,
        cut25: 0.30,
        cut50: 0.05,
        hike25: 0.0,
        hike50: 0.0,
      },
      sources: [MarketSource.CME_FEDWATCH, MarketSource.KALSHI, MarketSource.POLYMARKET],
      confidence: 0.85,
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response);
}
