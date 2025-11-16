'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { CalibrationChart } from './CalibrationChart';
import { Loader2 } from 'lucide-react';

interface AccuracyMetrics {
  overallBrierScore: number;
  totalResolved: number;
  averageConfidence: number;
  calibrationData: Array<{
    predictedProbability: number;
    actualFrequency: number;
    sampleSize: number;
  }>;
  bestPredictions: Array<{
    eventId: string;
    eventTitle: string;
    finalProbability: number;
    actualOutcome: boolean;
    brierScore: number;
  }>;
  worstPredictions: Array<{
    eventId: string;
    eventTitle: string;
    finalProbability: number;
    actualOutcome: boolean;
    brierScore: number;
  }>;
}

export function AccuracyDashboard() {
  const [metrics, setMetrics] = useState<AccuracyMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch('/api/analytics/accuracy');
        if (!response.ok) throw new Error('Failed to fetch accuracy metrics');
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !metrics) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">
            {error || 'No accuracy data available yet'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const brierScoreColor =
    metrics.overallBrierScore <= 0.1 ? 'text-green-600' :
    metrics.overallBrierScore <= 0.2 ? 'text-yellow-600' :
    'text-red-600';

  return (
    <div className="space-y-6">
      {/* Overall Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall Brier Score</CardDescription>
            <CardTitle className={`text-4xl ${brierScoreColor}`}>
              {metrics.overallBrierScore.toFixed(4)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Lower is better • Perfect score = 0.0000
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Resolved Events</CardDescription>
            <CardTitle className="text-4xl">{metrics.totalResolved}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Events with confirmed outcomes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Confidence</CardDescription>
            <CardTitle className="text-4xl">
              {(metrics.averageConfidence * 100).toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Mean predicted probability
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Calibration Curve */}
      <Card>
        <CardHeader>
          <CardTitle>Calibration Curve</CardTitle>
          <CardDescription>
            How well do our probability estimates match reality?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CalibrationChart data={metrics.calibrationData} />
        </CardContent>
      </Card>

      {/* Best and Worst Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Predictions */}
        <Card>
          <CardHeader>
            <CardTitle>Best Predictions</CardTitle>
            <CardDescription>Lowest Brier scores (most accurate)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.bestPredictions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No resolved predictions yet
                </p>
              ) : (
                metrics.bestPredictions.map((pred) => (
                  <div
                    key={pred.eventId}
                    className="flex items-start justify-between border-b pb-3 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-2">
                        {pred.eventTitle}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Predicted: {(pred.finalProbability * 100).toFixed(1)}% •
                        Actual: {pred.actualOutcome ? 'YES' : 'NO'}
                      </p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-sm font-bold text-green-600">
                        {pred.brierScore.toFixed(4)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Worst Predictions */}
        <Card>
          <CardHeader>
            <CardTitle>Worst Predictions</CardTitle>
            <CardDescription>Highest Brier scores (least accurate)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.worstPredictions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No resolved predictions yet
                </p>
              ) : (
                metrics.worstPredictions.map((pred) => (
                  <div
                    key={pred.eventId}
                    className="flex items-start justify-between border-b pb-3 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-2">
                        {pred.eventTitle}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Predicted: {(pred.finalProbability * 100).toFixed(1)}% •
                        Actual: {pred.actualOutcome ? 'YES' : 'NO'}
                      </p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-sm font-bold text-red-600">
                        {pred.brierScore.toFixed(4)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
