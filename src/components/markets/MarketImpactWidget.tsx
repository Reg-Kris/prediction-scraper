'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function MarketImpactWidget() {
  // Mock data - will be replaced with real API call
  const mockData = {
    highImpactEvents: [
      {
        date: 'Dec 6',
        event: 'Jobs Report',
        impact: 'HIGH' as const,
      },
      {
        date: 'Dec 11',
        event: 'CPI Release',
        impact: 'HIGH' as const,
      },
      {
        date: 'Dec 18',
        event: 'FOMC Meeting',
        impact: 'CRITICAL' as const,
      },
    ],
  };

  const getImpactVariant = (impact: string) => {
    switch (impact) {
      case 'CRITICAL':
        return 'critical';
      case 'HIGH':
        return 'high';
      case 'MEDIUM':
        return 'medium';
      default:
        return 'low';
    }
  };

  const getImpactEmoji = (impact: string) => {
    switch (impact) {
      case 'CRITICAL':
        return '🔴';
      case 'HIGH':
        return '⚠️';
      case 'MEDIUM':
        return '🟡';
      default:
        return '🟢';
    }
  };

  return (
    <Card>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span>📊</span>
            Aggregated Market Impact for SPY/QQQ
          </h2>
          <p className="text-slate-600 mt-1">High-impact events for options traders</p>
        </div>

        <div>
          <h3 className="font-semibold text-slate-900 mb-3">High Impact Events (Next 30 Days)</h3>
          <div className="space-y-2">
            {mockData.highImpactEvents.map((event, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-slate-600 min-w-[60px]">
                    {event.date}
                  </div>
                  <div className="font-medium text-slate-900">{event.event}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getImpactEmoji(event.impact)}</span>
                  <Badge variant={getImpactVariant(event.impact)}>
                    {event.impact}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm font-medium text-slate-900 mb-2">
            📉 Volatility Forecast
          </div>
          <div className="text-sm text-slate-700">
            Elevated volatility expected around FOMC meeting (Dec 18).
            Consider adjusting option positions for increased implied volatility.
          </div>
        </div>
      </div>
    </Card>
  );
}
