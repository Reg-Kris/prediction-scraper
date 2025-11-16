'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface CalibrationDataPoint {
  predictedProbability: number;
  actualFrequency: number;
  sampleSize: number;
}

interface CalibrationChartProps {
  data: CalibrationDataPoint[];
}

export function CalibrationChart({ data }: CalibrationChartProps) {
  // Transform data for Recharts
  const chartData = data.map((point) => ({
    predicted: point.predictedProbability,
    actual: point.actualFrequency,
    samples: point.sampleSize,
    // For tooltip display
    predictedPercent: (point.predictedProbability * 100).toFixed(0),
    actualPercent: (point.actualFrequency * 100).toFixed(0),
  }));

  // Add perfect calibration line data
  const perfectCalibration = [
    { predicted: 0, actual: 0 },
    { predicted: 1, actual: 1 },
  ];

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          No calibration data available yet
        </p>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="predicted"
            label={{ value: 'Predicted Probability', position: 'insideBottom', offset: -5 }}
            domain={[0, 1]}
            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
          />
          <YAxis
            label={{ value: 'Actual Frequency', angle: -90, position: 'insideLeft' }}
            domain={[0, 1]}
            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const data = payload[0].payload;
              return (
                <div className="bg-background border rounded-lg p-3 shadow-lg">
                  <p className="text-sm font-medium mb-1">
                    Predicted: {data.predictedPercent}%
                  </p>
                  <p className="text-sm text-muted-foreground mb-1">
                    Actual: {data.actualPercent}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sample size: {data.samples}
                  </p>
                </div>
              );
            }}
          />
          <Legend />

          {/* Perfect calibration line (diagonal) */}
          <ReferenceLine
            stroke="#94a3b8"
            strokeDasharray="5 5"
            segment={[
              { x: 0, y: 0 },
              { x: 1, y: 1 },
            ]}
            label="Perfect"
          />

          {/* Actual calibration line */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', r: 5 }}
            name="Actual Frequency"
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <p className="text-xs text-muted-foreground mt-2 text-center">
        A well-calibrated model follows the diagonal line. Points above = overconfident, below = underconfident.
      </p>
    </div>
  );
}
