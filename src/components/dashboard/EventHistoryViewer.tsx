'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface HistoricalSnapshot {
  timestamp: string;
  probability: number;
}

interface EventHistory {
  eventId: string;
  eventTitle: string;
  category: string;
  currentProbability: number;
  snapshots: HistoricalSnapshot[];
}

export function EventHistoryViewer() {
  const [events, setEvents] = useState<EventHistory[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/analytics/history');
        if (!response.ok) throw new Error('Failed to fetch event history');
        const data = await response.json();
        setEvents(data.events || []);
        if (data.events && data.events.length > 0) {
          setSelectedEvent(data.events[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
    // Refresh every 5 minutes
    const interval = setInterval(fetchEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredEvents = events.filter((event) =>
    event.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFilteredSnapshots = (snapshots: HistoricalSnapshot[]) => {
    const now = new Date();
    let cutoffTime: Date;

    switch (timeRange) {
      case '24h':
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    return snapshots
      .filter((s) => new Date(s.timestamp) >= cutoffTime)
      .map((s) => ({
        time: new Date(s.timestamp).toLocaleString(),
        probability: s.probability * 100,
        timestamp: s.timestamp,
      }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event History Viewer</CardTitle>
          <CardDescription>Probability trends over time</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event History Viewer</CardTitle>
          <CardDescription>Probability trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-12">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event History Viewer</CardTitle>
          <CardDescription>Probability trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-12">
            No historical data available yet. Start tracking events to see trends.
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = selectedEvent ? getFilteredSnapshots(selectedEvent.snapshots) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event History Viewer</CardTitle>
        <CardDescription>
          Track probability changes over time for {events.length} event(s)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Time Range Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
            <TabsList>
              <TabsTrigger value="24h">24h</TabsTrigger>
              <TabsTrigger value="7d">7d</TabsTrigger>
              <TabsTrigger value="30d">30d</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Event List */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Event Selection Sidebar */}
          <div className="md:col-span-1 space-y-2 max-h-[400px] overflow-y-auto border rounded-lg p-2">
            {filteredEvents.map((event) => (
              <button
                key={event.eventId}
                onClick={() => setSelectedEvent(event)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedEvent?.eventId === event.eventId
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <p className="text-sm font-medium line-clamp-2">{event.eventTitle}</p>
                <p className="text-xs mt-1 opacity-75">
                  {event.category.replace('_', ' ')}
                </p>
                <p className="text-xs font-bold mt-1">
                  {(event.currentProbability * 100).toFixed(1)}%
                </p>
              </button>
            ))}

            {filteredEvents.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No events match your search
              </p>
            )}
          </div>

          {/* Chart Display */}
          <div className="md:col-span-3">
            {selectedEvent && (
              <div className="space-y-4">
                {/* Event Details */}
                <div className="border-b pb-3">
                  <h3 className="font-semibold text-lg">{selectedEvent.eventTitle}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-muted-foreground">
                      Category: {selectedEvent.category.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-bold">
                      Current: {(selectedEvent.currentProbability * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Probability Chart */}
                {chartData.length > 0 ? (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="time"
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis
                          domain={[0, 100]}
                          label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload || payload.length === 0) return null;
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background border rounded-lg p-3 shadow-lg">
                                <p className="text-sm font-medium">
                                  {data.probability.toFixed(2)}%
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {data.time}
                                </p>
                              </div>
                            );
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="probability"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', r: 3 }}
                          name="Probability (%)"
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center border rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      No data available for the selected time range
                    </p>
                  </div>
                )}

                {/* Stats Summary */}
                {chartData.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Data Points</p>
                      <p className="text-lg font-bold">{chartData.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Highest</p>
                      <p className="text-lg font-bold text-green-600">
                        {Math.max(...chartData.map((d) => d.probability)).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Lowest</p>
                      <p className="text-lg font-bold text-red-600">
                        {Math.min(...chartData.map((d) => d.probability)).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
