'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';

interface TrendDataPoint {
  date: Date;
  [key: string]: number | Date;
}

interface TrendChartProps {
  data: TrendDataPoint[];
  lines: { key: string; color: string; label: string }[];
  height?: number;
}

export function TrendChart({ data, lines, height = 300 }: TrendChartProps) {
  // Transform data for Recharts (needs timestamp as number)
  const chartData = data.map((point) => ({
    ...point,
    timestamp: point.date.getTime(),
    dateLabel: format(point.date, 'MMM d'),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="dateLabel"
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
          formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
          labelFormatter={(label) => `Date: ${label}`}
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: '12px',
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px' }}
          iconType="line"
        />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            stroke={line.color}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name={line.label}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
