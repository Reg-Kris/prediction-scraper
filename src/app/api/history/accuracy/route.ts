/**
 * API endpoint for system-wide accuracy metrics
 * GET /api/history/accuracy
 *
 * Returns:
 * - Overall Brier score
 * - Accuracy by category
 * - Best and worst predictions
 * - Calibration curve
 */

import { NextResponse } from 'next/server';
import { ResolutionService } from '@/lib/services/resolution-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [systemAccuracy, calibrationCurve] = await Promise.all([
      ResolutionService.getSystemAccuracy(),
      ResolutionService.getCalibrationCurve(10),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        overall: {
          totalResolutions: systemAccuracy.totalResolutions,
          averageBrierScore: systemAccuracy.averageBrierScore,
          averageCalibrationError: systemAccuracy.averageCalibrationError,
          quality:
            systemAccuracy.averageBrierScore === 0
              ? 'No data'
              : systemAccuracy.averageBrierScore < 0.1
              ? 'Excellent'
              : systemAccuracy.averageBrierScore < 0.25
              ? 'Good'
              : systemAccuracy.averageBrierScore < 0.5
              ? 'Fair'
              : 'Poor',
          benchmarks: {
            perfect: 0.0,
            random: 0.25,
            worst: 1.0,
            current: systemAccuracy.averageBrierScore,
          },
        },
        byCategory: systemAccuracy.accuracyByCategory.map((cat) => ({
          category: cat.category,
          eventCount: cat.count,
          averageBrierScore: cat.averageBrierScore,
          quality:
            cat.averageBrierScore < 0.1
              ? 'Excellent'
              : cat.averageBrierScore < 0.25
              ? 'Good'
              : cat.averageBrierScore < 0.5
              ? 'Fair'
              : 'Poor',
        })),
        bestPredictions: systemAccuracy.bestPredictions,
        worstPredictions: systemAccuracy.worstPredictions,
        calibration: {
          description:
            'Shows how well-calibrated predictions are. Perfect calibration: predicted = actual.',
          curve: calibrationCurve,
          isWellCalibrated: evaluateCalibration(calibrationCurve),
        },
      },
      metadata: {
        timestamp: new Date().toISOString(),
        description:
          'System-wide accuracy metrics. Lower Brier scores are better (0=perfect).',
      },
    });
  } catch (error) {
    console.error('[API] Get accuracy metrics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get accuracy metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function evaluateCalibration(
  curve: Array<{ predictedProbability: number; actualFrequency: number }>
): boolean {
  if (curve.length === 0) return false;

  // Calculate average absolute difference between predicted and actual
  const avgDiff =
    curve.reduce(
      (sum, point) => sum + Math.abs(point.predictedProbability - point.actualFrequency),
      0
    ) / curve.length;

  // Well-calibrated if average difference is less than 0.1
  return avgDiff < 0.1;
}
