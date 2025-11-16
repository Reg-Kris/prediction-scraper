/**
 * Auto-Resolution API
 * POST /api/resolution/auto - Trigger auto-resolution process
 * GET /api/resolution/auto - Get auto-resolution status
 *
 * Processes pending event resolutions automatically
 */

import { NextResponse } from 'next/server';
import { AutoResolutionService } from '@/lib/services/auto-resolution-service';
import { getResolutionSchedulerStatus } from '@/lib/jobs/resolution-scheduler';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const dryRun = body.dryRun === true;
    const daysAfterClose = body.daysAfterClose || 1;

    console.log('[API] Manual auto-resolution triggered');
    console.log(`[API] Dry run: ${dryRun}`);
    console.log(`[API] Days after close: ${daysAfterClose}`);

    const summary = await AutoResolutionService.processAll(daysAfterClose, dryRun);

    return NextResponse.json({
      success: true,
      message: dryRun
        ? 'Dry run completed - no events were actually resolved'
        : 'Auto-resolution process completed',
      data: {
        totalProcessed: summary.totalProcessed,
        autoResolved: summary.autoResolved,
        pendingReview: summary.pendingReview,
        insufficientData: summary.insufficientData,
        errors: summary.errors,
        duration: summary.duration,
        results: summary.results.map((r) => ({
          eventId: r.eventId,
          eventTitle: r.eventTitle,
          status: r.status,
          outcome: r.outcome,
          confidence: r.confidence,
        })),
      },
    });
  } catch (error) {
    console.error('[API] Auto-resolution error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run auto-resolution',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const schedulerStatus = getResolutionSchedulerStatus();

    return NextResponse.json({
      success: true,
      data: {
        scheduler: schedulerStatus,
        description:
          'Auto-resolution automatically resolves closed events by checking original sources',
      },
    });
  } catch (error) {
    console.error('[API] Get auto-resolution status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get auto-resolution status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
