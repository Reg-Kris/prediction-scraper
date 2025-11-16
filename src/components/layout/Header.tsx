'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

export function Header() {
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 5 * 60 * 1000); // Update every 5 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Prediction Market Aggregator
            </h1>
            <p className="text-slate-600 mt-1">
              Real-time odds for SPY/QQQ trading insights
            </p>
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
