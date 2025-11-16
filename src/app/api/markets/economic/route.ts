import { NextResponse } from 'next/server';
import type { EconomicEventsResponse } from '@/types/api';
import { EventCategory } from '@/types/market';

export async function GET() {
  // Mock data for now - will be replaced with actual scraper implementation
  const response: EconomicEventsResponse = {
    success: true,
    data: [
      {
        id: 'economic-jobs-report-dec-2025',
        title: 'December 2025 Jobs Report',
        description: 'Nonfarm payroll employment change',
        category: EventCategory.ECONOMIC_DATA,
        closeDate: new Date('2025-12-06'),
        releaseDate: new Date('2025-12-06'),
        indicator: 'Nonfarm Payrolls',
        tags: ['SPY', 'QQQ', 'employment'],
        probabilities: {
          'above_200k': 0.35,
          '100k_to_200k': 0.45,
          'below_100k': 0.20,
        },
      },
      {
        id: 'economic-cpi-dec-2025',
        title: 'December 2025 CPI Release',
        description: 'Consumer Price Index year-over-year change',
        category: EventCategory.ECONOMIC_DATA,
        closeDate: new Date('2025-12-11'),
        releaseDate: new Date('2025-12-11'),
        indicator: 'CPI',
        tags: ['SPY', 'QQQ', 'inflation'],
        probabilities: {
          'above_3pct': 0.65,
          '2_to_3pct': 0.30,
          'below_2pct': 0.05,
        },
      },
    ],
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response);
}
