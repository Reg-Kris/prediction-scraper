'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function ElectionsWidget() {
  // Mock data - will be replaced with real API call
  const mockData = {
    events: [
      {
        title: '2024 Presidential',
        status: 'Closed',
        winner: 'Market Resolved',
      },
      {
        title: '2026 Midterms - House Control',
        probabilities: [
          { party: 'GOP', probability: 58 },
          { party: 'DEM', probability: 42 },
        ],
      },
    ],
  };

  return (
    <Card>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>🗳️</span>
            Elections
          </h2>
          <p className="text-slate-600 text-sm mt-1">Political prediction markets</p>
        </div>

        <div className="space-y-4">
          {mockData.events.map((event, idx) => (
            <div key={idx} className="border-b border-slate-200 last:border-0 pb-4 last:pb-0">
              <div className="font-medium text-slate-900">{event.title}</div>

              {event.status ? (
                <Badge variant="success" className="mt-2">
                  {event.winner}
                </Badge>
              ) : (
                <div className="mt-2 space-y-1">
                  {event.probabilities?.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{p.party}:</span>
                      <span className="font-semibold">{p.probability}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
          Sources: Polymarket, PredictIt
        </div>
      </div>
    </Card>
  );
}
