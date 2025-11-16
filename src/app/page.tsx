import { FedPolicyWidget } from '@/components/markets/FedPolicyWidget';
import { ElectionsWidget } from '@/components/markets/ElectionsWidget';
import { EconomicEventsWidget } from '@/components/markets/EconomicEventsWidget';
import { MarketImpactWidget } from '@/components/markets/MarketImpactWidget';
import { Header } from '@/components/layout/Header';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Header />

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Fed Policy Section */}
        <section>
          <FedPolicyWidget />
        </section>

        {/* Elections and Economic Events Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ElectionsWidget />
          <EconomicEventsWidget />
        </section>

        {/* Aggregated Market Impact */}
        <section>
          <MarketImpactWidget />
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
