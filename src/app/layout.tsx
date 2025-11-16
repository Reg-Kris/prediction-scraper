import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Prediction Market Aggregator | SPY/QQQ Trading Insights',
  description: 'Real-time prediction market data aggregation for informed options trading on SPY and QQQ',
  keywords: ['prediction markets', 'SPY', 'QQQ', 'options trading', 'market odds', 'fed policy'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
