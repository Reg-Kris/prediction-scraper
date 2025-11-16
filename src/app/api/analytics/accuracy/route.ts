import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all resolved events
    const resolvedEvents = await prisma.predictionEvent.findMany({
      where: {
        resolved: true,
        actualOutcome: { not: null },
      },
      include: {
        snapshots: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
        resolutions: {
          orderBy: { resolvedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (resolvedEvents.length === 0) {
      return NextResponse.json({
        overallBrierScore: 0,
        totalResolved: 0,
        averageConfidence: 0,
        calibrationData: [],
        bestPredictions: [],
        worstPredictions: [],
      });
    }

    // Calculate overall Brier score
    let totalBrierScore = 0;
    let totalConfidence = 0;
    const predictions: Array<{
      eventId: string;
      eventTitle: string;
      finalProbability: number;
      actualOutcome: boolean;
      brierScore: number;
    }> = [];

    for (const event of resolvedEvents) {
      const resolution = event.resolutions[0];
      if (!resolution || resolution.brierScore === null) continue;

      const finalSnapshot = event.snapshots[0];
      if (!finalSnapshot) continue;

      totalBrierScore += resolution.brierScore;
      totalConfidence += finalSnapshot.aggregatedProbability;

      predictions.push({
        eventId: event.eventId,
        eventTitle: event.eventTitle,
        finalProbability: finalSnapshot.aggregatedProbability,
        actualOutcome: event.actualOutcome!,
        brierScore: resolution.brierScore,
      });
    }

    const overallBrierScore = totalBrierScore / resolvedEvents.length;
    const averageConfidence = totalConfidence / resolvedEvents.length;

    // Sort predictions by Brier score
    predictions.sort((a, b) => a.brierScore - b.brierScore);

    const bestPredictions = predictions.slice(0, 5);
    const worstPredictions = predictions.slice(-5).reverse();

    // Calculate calibration data (bin predictions into deciles)
    const calibrationBins: Array<{
      predictedProbability: number;
      actualFrequency: number;
      sampleSize: number;
    }> = [];

    for (let i = 0; i < 10; i++) {
      const lowerBound = i / 10;
      const upperBound = (i + 1) / 10;
      const midpoint = (lowerBound + upperBound) / 2;

      const binnedPredictions = predictions.filter(
        (p) => p.finalProbability >= lowerBound && p.finalProbability < upperBound
      );

      if (binnedPredictions.length === 0) continue;

      const actualPositives = binnedPredictions.filter((p) => p.actualOutcome).length;
      const actualFrequency = actualPositives / binnedPredictions.length;

      calibrationBins.push({
        predictedProbability: midpoint,
        actualFrequency,
        sampleSize: binnedPredictions.length,
      });
    }

    return NextResponse.json({
      overallBrierScore,
      totalResolved: resolvedEvents.length,
      averageConfidence,
      calibrationData: calibrationBins,
      bestPredictions,
      worstPredictions,
    });
  } catch (error) {
    console.error('Error calculating accuracy metrics:', error);
    return NextResponse.json(
      { error: 'Failed to calculate accuracy metrics' },
      { status: 500 }
    );
  }
}
