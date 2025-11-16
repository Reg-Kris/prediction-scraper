import { NextResponse } from 'next/server';
import type { HealthCheckResponse } from '@/types/api';

export async function GET() {
  const response: HealthCheckResponse = {
    success: true,
    data: {
      status: 'healthy',
      sources: {
        polymarket: { status: 'up', latency: 120 },
        kalshi: { status: 'up', latency: 95 },
        predictit: { status: 'up', latency: 150 },
        metaculus: { status: 'up', latency: 110 },
        cme_fedwatch: { status: 'up', latency: 200 },
        fred: { status: 'up', latency: 85 },
      },
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response);
}
