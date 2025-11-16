/**
 * API endpoint to trigger manual snapshot capture
 * POST /api/history/snapshot
 *
 * Captures current state of all prediction markets
 * Normally run via cron job, but can be triggered manually for testing
 */

import { NextResponse } from 'next/server';
import { SnapshotService } from '@/lib/services/snapshot-service';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('[API] Manual snapshot capture triggered');

    const result = await SnapshotService.captureSnapshot();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Snapshot captured successfully',
        data: {
          snapshotCount: result.snapshotCount,
          errors: result.errors,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Snapshot capture failed',
          errors: result.errors,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API] Snapshot capture error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to capture snapshot',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stats = await SnapshotService.getStatistics();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[API] Get snapshot statistics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get snapshot statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
