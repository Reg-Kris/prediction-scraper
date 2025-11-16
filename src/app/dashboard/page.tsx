import { Header } from '@/components/layout/Header';
import { AccuracyDashboard } from '@/components/dashboard/AccuracyDashboard';
import { EventHistoryViewer } from '@/components/dashboard/EventHistoryViewer';
import { MoversWidget } from '@/components/dashboard/MoversWidget';
import { SchedulerMonitor } from '@/components/dashboard/SchedulerMonitor';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Header />

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Historical tracking, accuracy metrics, and system monitoring
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Markets
          </Link>
        </div>

        {/* Accuracy Dashboard Section */}
        <section>
          <AccuracyDashboard />
        </section>

        {/* Movers and Scheduler Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MoversWidget />
          <SchedulerMonitor />
        </section>

        {/* Event History Viewer */}
        <section>
          <EventHistoryViewer />
        </section>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground py-8 border-t">
          <p>
            Prediction Market Aggregator • Data for informational purposes only •{' '}
            <a
              href="https://github.com/Reg-Kris/prediction-scraper"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
