'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function EconomicEventsWidget() {
  // Mock data - will be replaced with real API call
  const mockData = {
    events: [
      {
        title: 'Next Jobs Report',
        date: 'Dec 6',
        probabilities: [
          { label: '>200K jobs', probability: 35 },
          { label: '100-200K jobs', probability: 45 },
          { label: '<100K jobs', probability: 20 },
        ],
      },
      {
        title: 'CPI Release',
        date: 'Dec 11',
        probabilities: [
          { label: '>3%', probability: 65 },
          { label: '2-3%', probability: 30 },
          { label: '<2%', probability: 5 },
        ],
      },
    ],
  };

  return (
    <Card>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>📈</span>
            Economic Events
          </h2>
          <p className="text-slate-600 text-sm mt-1">Upcoming data releases</p>
        </div>

        <div className="space-y-4">
          {mockData.events.map((event, idx) => (
            <div key={idx} className="border-b border-slate-200 last:border-0 pb-4 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-slate-900">{event.title}</div>
                <Badge variant="default">{event.date}</Badge>
              </div>

              <div className="space-y-1">
                {event.probabilities.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{p.label}:</span>
                    <span className="font-semibold">{p.probability}%</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
          Sources: Kalshi, FRED
        </div>
      </div>
    </Card>
  );
}
