/**
 * Polymarket Gamma API scraper
 * Documentation: https://docs.polymarket.com/
 * Base URL: https://gamma-api.polymarket.com
 * NOTE: Bulgaria is NOT on the restricted countries list
 * Read-only access available without authentication
 */

import { BasePredictionScraper, EventFilters } from './base-scraper';
import { MarketSource, PredictionMarketEvent, MarketOdds, EventCategory } from '@/types/market';
import { ImpactScorer } from '../services/impact-scorer';

interface PolymarketMarket {
  id: string;
  question: string;
  description?: string;
  outcomePrices: string; // JSON stringified array
  volume: string;
  active: boolean;
  closed: boolean;
  startDate: string;
  endDate: string;
  clobTokenIds: string; // JSON stringified array
  slug: string;
  tags?: string[];
}

export class PolymarketScraper extends BasePredictionScraper {
  constructor(apiKey?: string) {
    super(
      MarketSource.POLYMARKET,
      'https://gamma-api.polymarket.com',
      { requests: 16, windowMs: 60000 }, // ~1000 calls/hour = 16.67 calls/min
      30000
    );

    // Add API key if provided (for premium features)
    if (apiKey) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`;
    }
  }

  async fetchEvents(filters?: EventFilters): Promise<PredictionMarketEvent[]> {
    await this.rateLimiter.wait();

    try {
      const params: Record<string, unknown> = {
        limit: filters?.limit || 100,
        offset: filters?.offset || 0,
      };

      if (filters?.active === true) {
        params.active = true;
        params.closed = false;
      }

      if (filters?.tags && filters.tags.length > 0) {
        params.tag = filters.tags[0]; // Polymarket supports single tag filtering
      }

      const response = await this.client.get<PolymarketMarket[]>('/markets', { params });

      this.log('info', `Fetched ${response.data.length} markets`);

      return response.data
        .filter((market) => this.isRelevantMarket(market))
        .map((market) => this.transformToEvent(market));
    } catch (error) {
      this.handleError('fetchEvents', error);
    }
  }

  async fetchOdds(eventId: string): Promise<MarketOdds> {
    await this.rateLimiter.wait();

    try {
      const id = eventId.replace('polymarket-', '');
      const response = await this.client.get<PolymarketMarket>(`/markets/${id}`);

      return this.transformToOdds(response.data);
    } catch (error) {
      this.handleError('fetchOdds', error);
    }
  }

  async search(query: string): Promise<PredictionMarketEvent[]> {
    await this.rateLimiter.wait();

    try {
      // Polymarket doesn't have explicit search, so we filter by fetching all and matching
      const response = await this.client.get<PolymarketMarket[]>('/markets', {
        params: {
          limit: 100,
          active: true,
        },
      });

      const lowerQuery = query.toLowerCase();
      return response.data
        .filter((market) => {
          const text = `${market.question} ${market.description || ''}`.toLowerCase();
          return text.includes(lowerQuery) && this.isRelevantMarket(market);
        })
        .map((market) => this.transformToEvent(market));
    } catch (error) {
      this.handleError('search', error);
    }
  }

  private transformToEvent(market: PolymarketMarket): PredictionMarketEvent {
    const closeDate = new Date(market.endDate);

    return {
      id: `polymarket-${market.id}`,
      title: market.question,
      description: market.description || '',
      category: this.categorizeEvent(market),
      closeDate,
      resolutionCriteria: market.description,
      tags: this.extractTags(market),
      url: `https://polymarket.com/event/${market.slug}`,
    };
  }

  private transformToOdds(market: PolymarketMarket): MarketOdds {
    // Parse outcome prices (stringified JSON array)
    let probability = 0.5;
    try {
      const prices = JSON.parse(market.outcomePrices) as number[];
      // For binary markets, take the first outcome price
      probability = prices[0] || 0.5;
    } catch (e) {
      this.log('warn', `Failed to parse outcome prices for market ${market.id}`);
    }

    // Parse volume
    let volume = 0;
    try {
      volume = parseFloat(market.volume);
    } catch (e) {
      this.log('warn', `Failed to parse volume for market ${market.id}`);
    }

    return {
      eventId: `polymarket-${market.id}`,
      source: this.source,
      probability,
      lastUpdated: new Date(),
      volume,
      metadata: {
        active: market.active,
        closed: market.closed,
        slug: market.slug,
        clobTokenIds: market.clobTokenIds,
      },
    };
  }

  private categorizeEvent(market: PolymarketMarket): EventCategory {
    const text = `${market.question} ${market.description || ''}`.toLowerCase();
    const tags = market.tags?.map((t) => t.toLowerCase()) || [];

    if (
      tags.includes('fed') ||
      tags.includes('rates') ||
      tags.includes('monetary-policy') ||
      text.includes('federal reserve') ||
      text.includes('interest rate') ||
      text.includes('fomc')
    ) {
      return EventCategory.FED_POLICY;
    }

    if (
      tags.includes('elections') ||
      tags.includes('politics') ||
      text.includes('election') ||
      text.includes('presidential')
    ) {
      return EventCategory.ELECTION;
    }

    if (
      tags.includes('economy') ||
      tags.includes('economics') ||
      text.includes('gdp') ||
      text.includes('inflation') ||
      text.includes('cpi') ||
      text.includes('jobs')
    ) {
      return EventCategory.ECONOMIC_DATA;
    }

    if (tags.includes('government') || text.includes('shutdown')) {
      return EventCategory.GOVERNMENT;
    }

    return EventCategory.GEOPOLITICAL;
  }

  private extractTags(market: PolymarketMarket): string[] {
    const tags = ['polymarket', ...(market.tags || [])];

    const event = this.transformToEvent(market);

    if (ImpactScorer.impactsSPY(event)) {
      tags.push('SPY');
    }

    if (ImpactScorer.impactsQQQ(event)) {
      tags.push('QQQ');
    }

    return tags;
  }

  private isRelevantMarket(market: PolymarketMarket): boolean {
    // Only active or recently closed markets
    if (!market.active && market.closed) {
      return false;
    }

    // Check if market is related to finance/economics/politics
    const text = `${market.question} ${market.description || ''}`.toLowerCase();
    const keywords = [
      'fed',
      'federal reserve',
      'interest rate',
      'election',
      'economy',
      'gdp',
      'inflation',
      'jobs',
      'unemployment',
      'market',
      'spy',
      'qqq',
      'shutdown',
      'congress',
      'president',
      'trump',
      'policy',
    ];

    return keywords.some((keyword) => text.includes(keyword));
  }
}
