/**
 * Aggregates data from multiple prediction market scrapers
 * Combines odds, calculates confidence, and scores market impact
 */

import { ManifoldScraper } from '../scrapers/manifold-scraper';
import { MetaculusScraper } from '../scrapers/metaculus-scraper';
import { PolymarketScraper } from '../scrapers/polymarket-scraper';
import { FredScraper } from '../scrapers/fred-scraper';
import { CMEFedWatchScraper } from '../scrapers/cme-fedwatch-scraper';
import { BasePredictionScraper } from '../scrapers/base-scraper';
import { AggregatedOdds, EventCategory, MarketOdds, PredictionMarketEvent } from '@/types/market';
import { OddsAggregator } from './odds-aggregator';
import { ImpactScorer } from './impact-scorer';
import { globalCache } from '../utils/cache';

export class ScraperAggregator {
  private scrapers: BasePredictionScraper[] = [];
  private cacheEnabled: boolean = true;

  constructor(options?: {
    manifoldEnabled?: boolean;
    metaculusEnabled?: boolean;
    polymarketEnabled?: boolean;
    fredEnabled?: boolean;
    cmeFedWatchEnabled?: boolean;
    polymarketApiKey?: string;
    fredApiKey?: string;
  }) {
    const opts = {
      manifoldEnabled: true,
      metaculusEnabled: true,
      polymarketEnabled: true,
      fredEnabled: false, // Requires API key
      cmeFedWatchEnabled: true,
      ...options,
    };

    // Initialize enabled scrapers
    if (opts.manifoldEnabled) {
      this.scrapers.push(new ManifoldScraper());
    }

    if (opts.metaculusEnabled) {
      this.scrapers.push(new MetaculusScraper());
    }

    if (opts.polymarketEnabled) {
      this.scrapers.push(new PolymarketScraper(opts.polymarketApiKey));
    }

    if (opts.fredEnabled && opts.fredApiKey) {
      this.scrapers.push(new FredScraper(opts.fredApiKey));
    }

    if (opts.cmeFedWatchEnabled) {
      this.scrapers.push(new CMEFedWatchScraper());
    }
  }

  /**
   * Fetch events from all enabled scrapers
   */
  async fetchAllEvents(category?: EventCategory): Promise<PredictionMarketEvent[]> {
    const cacheKey = `events:${category || 'all'}`;

    // Check cache first
    if (this.cacheEnabled) {
      const cached = globalCache.get(cacheKey);
      if (cached) {
        console.log(`[ScraperAggregator] Cache hit for ${cacheKey}`);
        return cached as PredictionMarketEvent[];
      }
    }

    console.log(`[ScraperAggregator] Fetching events from ${this.scrapers.length} scrapers...`);

    // Fetch from all scrapers in parallel
    const results = await Promise.allSettled(
      this.scrapers.map((scraper) => scraper.fetchEvents({ active: true, limit: 50 }))
    );

    // Combine and deduplicate events
    const allEvents: PredictionMarketEvent[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allEvents.push(...result.value);
      } else {
        console.error(
          `[ScraperAggregator] Scraper ${index} failed:`,
          result.reason
        );
      }
    });

    // Filter by category if specified
    const filteredEvents = category
      ? allEvents.filter((event) => event.category === category)
      : allEvents;

    // Sort by close date (soonest first)
    filteredEvents.sort((a, b) => a.closeDate.getTime() - b.closeDate.getTime());

    // Cache the results (15 minutes for distant events)
    if (this.cacheEnabled) {
      globalCache.set(cacheKey, filteredEvents, 900); // 15 min
    }

    console.log(
      `[ScraperAggregator] Fetched ${filteredEvents.length} events (${allEvents.length} total)`
    );

    return filteredEvents;
  }

  /**
   * Fetch odds from all sources for a specific event
   */
  async fetchOddsForEvent(eventId: string): Promise<MarketOdds[]> {
    const cacheKey = `odds:${eventId}`;

    // Check cache
    if (this.cacheEnabled) {
      const cached = globalCache.get(cacheKey);
      if (cached) {
        return cached as MarketOdds[];
      }
    }

    // Try to fetch from all scrapers
    const results = await Promise.allSettled(
      this.scrapers.map((scraper) => scraper.fetchOdds(eventId))
    );

    const odds: MarketOdds[] = [];
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        odds.push(result.value);
      }
    });

    // Cache for 5 minutes
    if (this.cacheEnabled && odds.length > 0) {
      globalCache.set(cacheKey, odds, 300);
    }

    return odds;
  }

  /**
   * Get aggregated odds with confidence and impact scoring
   */
  async getAggregatedOdds(events: PredictionMarketEvent[]): Promise<AggregatedOdds[]> {
    const aggregated: AggregatedOdds[] = [];

    for (const event of events) {
      try {
        const odds = await this.fetchOddsForEvent(event.id);

        if (odds.length === 0) {
          continue;
        }

        const { probability, confidence } = OddsAggregator.aggregate(odds);
        const impactScore = ImpactScorer.calculateImpact(event, odds);

        aggregated.push({
          eventId: event.id,
          event,
          odds,
          aggregatedProbability: probability,
          confidence,
          lastUpdated: new Date(),
          impactScore,
        });
      } catch (error) {
        console.error(`Failed to aggregate odds for event ${event.id}:`, error);
      }
    }

    // Sort by impact score (highest first)
    aggregated.sort((a, b) => b.impactScore.score - a.impactScore.score);

    return aggregated;
  }

  /**
   * Get Fed policy events with aggregated probabilities
   */
  async getFedPolicyData(): Promise<AggregatedOdds[]> {
    const events = await this.fetchAllEvents(EventCategory.FED_POLICY);
    return this.getAggregatedOdds(events.slice(0, 5)); // Top 5 Fed events
  }

  /**
   * Get election events with aggregated probabilities
   */
  async getElectionData(): Promise<AggregatedOdds[]> {
    const events = await this.fetchAllEvents(EventCategory.ELECTION);
    return this.getAggregatedOdds(events.slice(0, 10)); // Top 10 elections
  }

  /**
   * Get economic data events
   */
  async getEconomicData(): Promise<AggregatedOdds[]> {
    const events = await this.fetchAllEvents(EventCategory.ECONOMIC_DATA);
    return this.getAggregatedOdds(events.slice(0, 10));
  }

  /**
   * Search across all scrapers
   */
  async search(query: string): Promise<PredictionMarketEvent[]> {
    const results = await Promise.allSettled(
      this.scrapers.map((scraper) => scraper.search(query))
    );

    const allEvents: PredictionMarketEvent[] = [];
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allEvents.push(...result.value);
      }
    });

    return allEvents;
  }

  /**
   * Get high impact events (for dashboard summary)
   */
  async getHighImpactEvents(limit: number = 10): Promise<AggregatedOdds[]> {
    const allEvents = await this.fetchAllEvents();
    const aggregated = await this.getAggregatedOdds(allEvents);

    // Filter for high and critical impact
    const highImpact = aggregated.filter(
      (item) => item.impactScore.score >= 60 // HIGH or CRITICAL
    );

    return highImpact.slice(0, limit);
  }

  /**
   * Get events that impact SPY (S&P 500)
   */
  async getSPYImpactEvents(limit: number = 20): Promise<AggregatedOdds[]> {
    const allEvents = await this.fetchAllEvents();

    // Filter for SPY-tagged events
    const spyEvents = allEvents.filter((event) => event.tags.includes('SPY'));

    const aggregated = await this.getAggregatedOdds(spyEvents);
    return aggregated.slice(0, limit);
  }

  /**
   * Get events that impact QQQ (Nasdaq-100)
   */
  async getQQQImpactEvents(limit: number = 20): Promise<AggregatedOdds[]> {
    const allEvents = await this.fetchAllEvents();

    // Filter for QQQ-tagged events
    const qqqEvents = allEvents.filter((event) => event.tags.includes('QQQ'));

    const aggregated = await this.getAggregatedOdds(qqqEvents);
    return aggregated.slice(0, limit);
  }

  /**
   * Get events by specific category with tag filtering
   */
  async getEventsByFilters(options: {
    category?: EventCategory;
    tags?: string[];
    minImpactScore?: number;
    limit?: number;
  }): Promise<AggregatedOdds[]> {
    const { category, tags, minImpactScore, limit = 50 } = options;

    let events = await this.fetchAllEvents(category);

    // Filter by tags if specified
    if (tags && tags.length > 0) {
      events = events.filter((event) =>
        tags.some((tag) => event.tags.includes(tag))
      );
    }

    const aggregated = await this.getAggregatedOdds(events);

    // Filter by impact score if specified
    let filtered = aggregated;
    if (minImpactScore !== undefined) {
      filtered = aggregated.filter((item) => item.impactScore.score >= minImpactScore);
    }

    return filtered.slice(0, limit);
  }

  /**
   * Disable caching (useful for testing)
   */
  disableCache(): void {
    this.cacheEnabled = false;
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    globalCache.clear();
  }
}

// Export singleton instance
export const scraperAggregator = new ScraperAggregator({
  manifoldEnabled: true,
  metaculusEnabled: true,
  polymarketEnabled: true,
  fredEnabled: false, // Enable when API key is available
  cmeFedWatchEnabled: true,
});
