/**
 * Pending Resolutions API
 * GET /api/resolution/pending
 *
 * Returns events that are closed but not yet resolved
 */

import { NextResponse } from 'next/server';
import { SourceVerifier } from '@/lib/services/source-verifier';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const daysAfterClose = parseInt(searchParams.get('daysAfterClose') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const pending = await SourceVerifier.getPendingResolutions(daysAfterClose);

    // Limit results
    const limited = pending.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        total: pending.length,
        returned: limited.length,
        events: limited.map((e) => ({
          eventId: e.eventId,
          eventTitle: e.eventTitle,
          closeDate: e.closeDate,
          daysSinceClosed: e.daysSinceClosed,
        })),
      },
      metadata: {
        filters: {
          daysAfterClose,
          limit,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[API] Get pending resolutions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get pending resolutions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
