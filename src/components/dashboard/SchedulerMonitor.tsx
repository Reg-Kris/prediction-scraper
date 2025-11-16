'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Clock, CheckCircle2, XCircle, Loader2, PlayCircle } from 'lucide-react';

interface SchedulerStatus {
  name: string;
  enabled: boolean;
  running: boolean;
  schedule: string;
  nextRun: string | null;
  totalRuns: number;
  totalErrors: number;
  lastRunTime?: string;
  lastRunDuration?: number;
  lastRunStatus?: 'success' | 'error';
}

export function SchedulerMonitor() {
  const [snapshotStatus, setSnapshotStatus] = useState<SchedulerStatus | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<SchedulerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<{ snapshot: string; resolution: string }>({
    snapshot: '',
    resolution: '',
  });

  useEffect(() => {
    async function fetchStatus() {
      try {
        const [snapshotRes, resolutionRes] = await Promise.all([
          fetch('/api/scheduler/status'),
          fetch('/api/resolution/auto'),
        ]);

        if (!snapshotRes.ok || !resolutionRes.ok) {
          throw new Error('Failed to fetch scheduler status');
        }

        const snapshotData = await snapshotRes.json();
        const resolutionData = await resolutionRes.json();

        setSnapshotStatus({
          name: 'Snapshot Scheduler',
          ...snapshotData,
        });

        setResolutionStatus({
          name: 'Resolution Scheduler',
          ...resolutionData.scheduler,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 30 * 1000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (snapshotStatus?.nextRun) {
        setCountdown((prev) => ({
          ...prev,
          snapshot: getCountdown(snapshotStatus.nextRun!),
        }));
      }
      if (resolutionStatus?.nextRun) {
        setCountdown((prev) => ({
          ...prev,
          resolution: getCountdown(resolutionStatus.nextRun!),
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [snapshotStatus, resolutionStatus]);

  function getCountdown(nextRun: string): string {
    const now = new Date();
    const next = new Date(nextRun);
    const diff = next.getTime() - now.getTime();

    if (diff <= 0) return 'Running now...';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scheduler Monitor</CardTitle>
          <CardDescription>System automation status</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scheduler Monitor</CardTitle>
          <CardDescription>System automation status</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const renderSchedulerCard = (status: SchedulerStatus | null, countdownText: string) => {
    if (!status) return null;

    const statusColor = status.running ? 'bg-green-500' : 'bg-red-500';
    const successRate =
      status.totalRuns > 0
        ? (((status.totalRuns - status.totalErrors) / status.totalRuns) * 100).toFixed(1)
        : '100.0';

    return (
      <div className="border rounded-lg p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusColor}`} />
            <h4 className="font-semibold">{status.name}</h4>
          </div>
          <Badge variant={status.running ? 'default' : 'secondary'}>
            {status.running ? 'Running' : 'Stopped'}
          </Badge>
        </div>

        {/* Next Run Countdown */}
        {status.running && status.nextRun && (
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Next run in</span>
              </div>
              <span className="text-lg font-mono font-bold">{countdownText}</span>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div>
            <p className="text-xs text-muted-foreground">Total Runs</p>
            <p className="text-lg font-bold">{status.totalRuns}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Errors</p>
            <p className="text-lg font-bold text-red-600">{status.totalErrors}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Success Rate</p>
            <p className="text-lg font-bold text-green-600">{successRate}%</p>
          </div>
        </div>

        {/* Last Run Info */}
        {status.lastRunTime && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Last run</span>
              <div className="flex items-center gap-2">
                {status.lastRunStatus === 'success' ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-600" />
                )}
                <span>
                  {new Date(status.lastRunTime).toLocaleString()}
                </span>
              </div>
            </div>
            {status.lastRunDuration && (
              <p className="text-xs text-muted-foreground mt-1">
                Duration: {(status.lastRunDuration / 1000).toFixed(2)}s
              </p>
            )}
          </div>
        )}

        {/* Schedule */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Schedule: <span className="font-mono">{status.schedule}</span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduler Monitor</CardTitle>
        <CardDescription>System automation status and metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderSchedulerCard(snapshotStatus, countdown.snapshot)}
        {renderSchedulerCard(resolutionStatus, countdown.resolution)}

        {/* System Status Summary */}
        {snapshotStatus && resolutionStatus && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">System Status</span>
              </div>
              <Badge variant={snapshotStatus.running && resolutionStatus.running ? 'default' : 'destructive'}>
                {snapshotStatus.running && resolutionStatus.running ? 'All Systems Operational' : 'Issues Detected'}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
