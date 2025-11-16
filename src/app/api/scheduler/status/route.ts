/**
 * Scheduler Status API
 * GET /api/scheduler/status
 *
 * Returns the current status of the automated snapshot scheduler
 */

import { NextResponse } from 'next/server';
import { getSchedulerStatus } from '@/lib/jobs/snapshot-scheduler';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = getSchedulerStatus();

    return NextResponse.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Get scheduler status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get scheduler status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
