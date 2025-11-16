'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DataPoint {
  name: string;
  probability: number;
}

interface ProbabilityChartProps {
  data: DataPoint[];
  height?: number;
}

const COLORS = {
  high: '#3b82f6',    // blue-500
  medium: '#22c55e',  // green-500
  low: '#6366f1',     // indigo-500
};

export function ProbabilityChart({ data, height = 200 }: ProbabilityChartProps) {
  // Determine color based on probability
  const getColor = (probability: number) => {
    if (probability > 0.6) return COLORS.high;
    if (probability > 0.3) return COLORS.medium;
    return COLORS.low;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: '#64748b' }}
          tickLine={{ stroke: '#e2e8f0' }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#64748b' }}
          tickLine={{ stroke: '#e2e8f0' }}
          tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
          domain={[0, 1]}
        />
        <Tooltip
          formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Probability']}
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: '12px',
          }}
        />
        <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColor(entry.probability)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
