import { NextResponse } from 'next/server';
import type { ElectionsResponse } from '@/types/api';
import { EventCategory } from '@/types/market';

export async function GET() {
  // Mock data for now - will be replaced with actual scraper implementation
  const response: ElectionsResponse = {
    success: true,
    data: [
      {
        id: 'election-2026-midterms-house',
        title: '2026 Midterms - House Control',
        description: 'Which party will control the House after 2026 midterms?',
        category: EventCategory.ELECTION,
        closeDate: new Date('2026-11-03'),
        tags: ['SPY', 'QQQ', 'politics'],
        electionDate: new Date('2026-11-03'),
        candidates: [
          { name: 'Republican', probability: 0.58 },
          { name: 'Democrat', probability: 0.42 },
        ],
      },
      {
        id: 'election-2026-midterms-senate',
        title: '2026 Midterms - Senate Control',
        description: 'Which party will control the Senate after 2026 midterms?',
        category: EventCategory.ELECTION,
        closeDate: new Date('2026-11-03'),
        tags: ['SPY', 'politics'],
        electionDate: new Date('2026-11-03'),
        candidates: [
          { name: 'Republican', probability: 0.52 },
          { name: 'Democrat', probability: 0.48 },
        ],
      },
    ],
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response);
}
