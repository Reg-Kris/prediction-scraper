/**
 * Event Verification API
 * GET /api/resolution/verify/[eventId]
 *
 * Checks if an event can be auto-resolved by verifying with original sources
 */

import { NextResponse } from 'next/server';
import { SourceVerifier } from '@/lib/services/source-verifier';
import { PrismaClient } from '@/generated/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const eventId = params.eventId;

    // Get event details from snapshots
    const prisma = new PrismaClient();
    const snapshot = await prisma.predictionSnapshot.findFirst({
      where: { eventId },
      select: {
        eventTitle: true,
        sources: true,
      },
    });

    await prisma.$disconnect();

    if (!snapshot) {
      return NextResponse.json(
        {
          success: false,
          error: 'Event not found',
          message: `No snapshots found for event ${eventId}`,
        },
        { status: 404 }
      );
    }

    // Parse sources
    let sources;
    try {
      sources = JSON.parse(snapshot.sources);
    } catch (e) {
      sources = [];
    }

    // Verify with original sources
    const verification = await SourceVerifier.verifyEvent(
      eventId,
      snapshot.eventTitle,
      sources
    );

    return NextResponse.json({
      success: true,
      data: {
        eventId: verification.eventId,
        eventTitle: verification.eventTitle,
        consensusOutcome: verification.consensusOutcome,
        consensusConfidence: verification.consensusConfidence,
        readyToResolve: verification.readyToResolve,
        recommendedOutcome: verification.recommendedOutcome,
        conflictingSources: verification.conflictingSources,
        sourceResults: verification.resolutions.map((r) => ({
          source: r.source,
          resolved: r.resolved,
          outcome: r.outcome,
          confidence: r.confidence,
          notes: r.notes,
          resolvedDate: r.resolvedDate,
        })),
      },
      metadata: {
        totalSources: sources.length,
        resolvedSources: verification.resolutions.filter((r) => r.resolved).length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[API] Verify event error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify event',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
