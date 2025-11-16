'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

interface MoverEvent {
  eventId: string;
  eventTitle: string;
  category: string;
  currentProbability: number;
  previousProbability: number;
  change: number;
  changePercent: number;
}

interface MoversData {
  gainers24h: MoverEvent[];
  losers24h: MoverEvent[];
  gainers7d: MoverEvent[];
  losers7d: MoverEvent[];
  gainers30d: MoverEvent[];
  losers30d: MoverEvent[];
}

export function MoversWidget() {
  const [movers, setMovers] = useState<MoversData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMovers() {
      try {
        const response = await fetch('/api/analytics/movers');
        if (!response.ok) throw new Error('Failed to fetch movers data');
        const data = await response.json();
        setMovers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchMovers();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMovers, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Biggest Movers</CardTitle>
          <CardDescription>Events with largest probability changes</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !movers) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Biggest Movers</CardTitle>
          <CardDescription>Events with largest probability changes</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            {error || 'No movers data available yet'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const renderMoversList = (events: MoverEvent[], type: 'gainer' | 'loser') => {
    if (events.length === 0) {
      return (
        <p className="text-sm text-muted-foreground text-center py-4">
          No significant changes in this period
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {events.map((event) => {
          const isGainer = type === 'gainer';
          const icon = isGainer ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          );
          const changeColor = isGainer ? 'text-green-600' : 'text-red-600';

          return (
            <div
              key={event.eventId}
              className="flex items-start justify-between border-b pb-3 last:border-0"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {icon}
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    {event.category.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm font-medium line-clamp-2">
                  {event.eventTitle}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(event.previousProbability * 100).toFixed(1)}% →{' '}
                  {(event.currentProbability * 100).toFixed(1)}%
                </p>
              </div>
              <div className="ml-4 text-right">
                <p className={`text-sm font-bold ${changeColor}`}>
                  {isGainer ? '+' : ''}
                  {(event.change * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {event.changePercent > 0 ? '+' : ''}
                  {event.changePercent.toFixed(0)}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Biggest Movers</CardTitle>
        <CardDescription>Events with largest probability changes</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="24h" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="24h">24 Hours</TabsTrigger>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
          </TabsList>

          <TabsContent value="24h" className="space-y-4 mt-4">
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Top Gainers
              </h4>
              {renderMoversList(movers.gainers24h, 'gainer')}
            </div>
            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                Top Losers
              </h4>
              {renderMoversList(movers.losers24h, 'loser')}
            </div>
          </TabsContent>

          <TabsContent value="7d" className="space-y-4 mt-4">
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Top Gainers
              </h4>
              {renderMoversList(movers.gainers7d, 'gainer')}
            </div>
            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                Top Losers
              </h4>
              {renderMoversList(movers.losers7d, 'loser')}
            </div>
          </TabsContent>

          <TabsContent value="30d" className="space-y-4 mt-4">
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Top Gainers
              </h4>
              {renderMoversList(movers.gainers30d, 'gainer')}
            </div>
            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                Top Losers
              </h4>
              {renderMoversList(movers.losers30d, 'loser')}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
