'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function FedPolicyWidget() {
  // Mock data - will be replaced with real API call
  const mockData = {
    meetingDate: 'Dec 18, 2025',
    currentRate: '4.50-4.75%',
    probabilities: {
      noChange: 65,
      cut25: 30,
      cut50: 5,
    },
    sources: ['CME FedWatch', 'Kalshi', 'Polymarket'],
    confidence: 85,
  };

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span>🏛️</span>
              Federal Reserve Policy
            </h2>
            <p className="text-slate-600 mt-1">
              Next FOMC Meeting: {mockData.meetingDate} • Current Rate: {mockData.currentRate}
            </p>
          </div>
          <Badge variant="success">Live Data</Badge>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900">Next Meeting Probabilities</h3>

          <div className="space-y-2">
            <ProbabilityBar label="No Change" probability={mockData.probabilities.noChange} color="bg-blue-500" />
            <ProbabilityBar label="-25 bps" probability={mockData.probabilities.cut25} color="bg-green-500" />
            <ProbabilityBar label="-50 bps" probability={mockData.probabilities.cut50} color="bg-green-600" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-sm">
          <div className="text-slate-600">
            Sources: {mockData.sources.join(', ')}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600">Confidence:</span>
            <Badge variant="success">{mockData.confidence}%</Badge>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-800">
          <strong>Market Impact:</strong> Fed rate decisions are CRITICAL for SPY/QQQ.
          High uncertainty indicates potential volatility in options markets.
        </div>
      </div>
    </Card>
  );
}

interface ProbabilityBarProps {
  label: string;
  probability: number;
  color: string;
}

function ProbabilityBar({ label, probability, color }: ProbabilityBarProps) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-slate-900">{probability}%</span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${probability}%` }}
        />
      </div>
    </div>
  );
}
