import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface MoverEvent {
  eventId: string;
  eventTitle: string;
  category: string;
  currentProbability: number;
  previousProbability: number;
  change: number;
  changePercent: number;
}

async function getMovers(hoursAgo: number, limit: number = 5) {
  const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

  // Get all active events with snapshots
  const events = await prisma.predictionEvent.findMany({
    where: {
      status: 'active',
    },
    include: {
      snapshots: {
        orderBy: { timestamp: 'desc' },
        take: 100, // Get enough snapshots to find one from the time period
      },
    },
  });

  const movers: MoverEvent[] = [];

  for (const event of events) {
    if (event.snapshots.length === 0) continue;

    const currentSnapshot = event.snapshots[0];

    // Find the snapshot closest to the cutoff time
    const oldSnapshot = event.snapshots
      .slice()
      .reverse()
      .find((s) => new Date(s.timestamp) <= cutoffTime);

    if (!oldSnapshot) continue;

    const currentProb = currentSnapshot.aggregatedProbability;
    const previousProb = oldSnapshot.aggregatedProbability;
    const change = currentProb - previousProb;
    const changePercent = previousProb !== 0
      ? (change / previousProb) * 100
      : change * 100;

    // Only include if there's a meaningful change (>1%)
    if (Math.abs(change) >= 0.01) {
      movers.push({
        eventId: event.eventId,
        eventTitle: event.eventTitle,
        category: event.category,
        currentProbability: currentProb,
        previousProbability: previousProb,
        change,
        changePercent,
      });
    }
  }

  // Sort by absolute change (descending)
  movers.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  // Split into gainers and losers
  const gainers = movers.filter((m) => m.change > 0).slice(0, limit);
  const losers = movers.filter((m) => m.change < 0).slice(0, limit);

  return { gainers, losers };
}

export async function GET() {
  try {
    const [movers24h, movers7d, movers30d] = await Promise.all([
      getMovers(24),
      getMovers(24 * 7),
      getMovers(24 * 30),
    ]);

    return NextResponse.json({
      gainers24h: movers24h.gainers,
      losers24h: movers24h.losers,
      gainers7d: movers7d.gainers,
      losers7d: movers7d.losers,
      gainers30d: movers30d.gainers,
      losers30d: movers30d.losers,
    });
  } catch (error) {
    console.error('Error calculating movers:', error);
    return NextResponse.json(
      { error: 'Failed to calculate movers' },
      { status: 500 }
    );
  }
}
