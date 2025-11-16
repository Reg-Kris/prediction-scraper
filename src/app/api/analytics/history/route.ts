import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const limit = parseInt(searchParams.get('limit') || '20');

    // If specific event requested, return just that event's history
    if (eventId) {
      const event = await prisma.predictionEvent.findUnique({
        where: { eventId },
        include: {
          snapshots: {
            orderBy: { timestamp: 'desc' },
            select: {
              timestamp: true,
              aggregatedProbability: true,
            },
          },
        },
      });

      if (!event) {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        eventId: event.eventId,
        eventTitle: event.eventTitle,
        category: event.category,
        currentProbability: event.snapshots[0]?.aggregatedProbability || 0,
        snapshots: event.snapshots.map((s) => ({
          timestamp: s.timestamp.toISOString(),
          probability: s.aggregatedProbability,
        })),
      });
    }

    // Otherwise, return all events with their recent history
    const events = await prisma.predictionEvent.findMany({
      where: {
        status: { in: ['active', 'closed'] },
      },
      orderBy: { lastUpdated: 'desc' },
      take: limit,
      include: {
        snapshots: {
          orderBy: { timestamp: 'desc' },
          take: 100, // Last 100 snapshots per event
          select: {
            timestamp: true,
            aggregatedProbability: true,
          },
        },
      },
    });

    const eventsWithHistory = events
      .filter((e) => e.snapshots.length > 0)
      .map((event) => ({
        eventId: event.eventId,
        eventTitle: event.eventTitle,
        category: event.category,
        currentProbability: event.snapshots[0]?.aggregatedProbability || 0,
        snapshots: event.snapshots.map((s) => ({
          timestamp: s.timestamp.toISOString(),
          probability: s.aggregatedProbability,
        })),
      }));

    return NextResponse.json({
      events: eventsWithHistory,
      total: eventsWithHistory.length,
    });
  } catch (error) {
    console.error('Error fetching event history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event history' },
      { status: 500 }
    );
  }
}
