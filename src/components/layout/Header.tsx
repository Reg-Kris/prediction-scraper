'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Home } from 'lucide-react';

export function Header() {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const pathname = usePathname();

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 5 * 60 * 1000); // Update every 5 minutes

    return () => clearInterval(interval);
  }, []);

  const isDashboard = pathname === '/dashboard';

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Prediction Market Aggregator
              </h1>
              <p className="text-slate-600 mt-1">
                Real-time odds for SPY/QQQ trading insights
              </p>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center gap-2 ml-4">
              <Link
                href="/"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  !isDashboard
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Home className="h-4 w-4" />
                Markets
              </Link>
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isDashboard
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Link>
            </div>
          </div>

          <div className="mt-4 md:mt-0 flex items-center space-x-4 text-sm text-slate-500">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span>Live</span>
            </div>
            <div>
              Last updated: {format(lastUpdated, 'MMM d, h:mm a')}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
