/**
 * Manifold Markets API scraper
 * Documentation: https://docs.manifold.markets/api
 * Available globally, no authentication required for read operations
 */

import { BasePredictionScraper, EventFilters } from './base-scraper';
import { MarketSource, PredictionMarketEvent, MarketOdds, EventCategory } from '@/types/market';
import { ImpactScorer } from '../services/impact-scorer';

interface ManifoldMarket {
  id: string;
  creatorUsername: string;
  question: string;
  description?: string;
  url: string;
  outcomeType: string;
  mechanism: string;
  probability?: number;
  volume: number;
  volume24Hours: number;
  createdTime: number;
  closeTime: number | null;
  isResolved: boolean;
  resolution?: string;
  resolutionTime?: number;
  resolutionProbability?: number;
}

export class ManifoldScraper extends BasePredictionScraper {
  constructor() {
    super(
      MarketSource.MANIFOLD,
      'https://api.manifold.markets/v0',
      { requests: 500, windowMs: 60000 }, // 500 req/min
      30000
    );
  }

  async fetchEvents(filters?: EventFilters): Promise<PredictionMarketEvent[]> {
    await this.rateLimiter.wait();

    try {
      const params: Record<string, unknown> = {
        limit: filters?.limit || 100,
        sort: 'created-time',
        order: 'desc',
      };

      if (filters?.active === true) {
        // Only get open markets
        params.filter = 'open';
      }

      const response = await this.client.get<ManifoldMarket[]>('/markets', { params });

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
      const response = await this.client.get<ManifoldMarket>(`/market/${eventId}`);
      return this.transformToOdds(response.data);
    } catch (error) {
      this.handleError('fetchOdds', error);
    }
  }

  async search(query: string): Promise<PredictionMarketEvent[]> {
    await this.rateLimiter.wait();

    try {
      const response = await this.client.get<ManifoldMarket[]>('/search-markets', {
        params: {
          term: query,
          limit: 50,
          sort: 'relevance',
        },
      });

      return response.data
        .filter((market) => this.isRelevantMarket(market))
        .map((market) => this.transformToEvent(market));
    } catch (error) {
      this.handleError('search', error);
    }
  }

  private transformToEvent(market: ManifoldMarket): PredictionMarketEvent {
    const closeDate = market.closeTime ? new Date(market.closeTime) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const event: PredictionMarketEvent = {
      id: `manifold-${market.id}`,
      title: market.question,
      description: market.description || '',
      category: this.categorizeEvent(market),
      closeDate,
      resolutionCriteria: market.description,
      tags: this.extractTags(market),
      url: market.url,
    };

    return event;
  }

  private transformToOdds(market: ManifoldMarket): MarketOdds {
    return {
      eventId: `manifold-${market.id}`,
      source: this.source,
      probability: market.probability || 0.5,
      lastUpdated: new Date(),
      volume: market.volume24Hours || market.volume,
      metadata: {
        outcomeType: market.outcomeType,
        mechanism: market.mechanism,
        isResolved: market.isResolved,
        resolution: market.resolution,
      },
    };
  }

  private categorizeEvent(market: ManifoldMarket): EventCategory {
    const text = `${market.question} ${market.description || ''}`.toLowerCase();

    if (
      text.includes('fed') ||
      text.includes('federal reserve') ||
      text.includes('interest rate') ||
      text.includes('fomc')
    ) {
      return EventCategory.FED_POLICY;
    }

    if (
      text.includes('election') ||
      text.includes('presidential') ||
      text.includes('congress') ||
      text.includes('senate') ||
      text.includes('house')
    ) {
      return EventCategory.ELECTION;
    }

    if (
      text.includes('gdp') ||
      text.includes('inflation') ||
      text.includes('cpi') ||
      text.includes('unemployment') ||
      text.includes('jobs report')
    ) {
      return EventCategory.ECONOMIC_DATA;
    }

    if (text.includes('shutdown') || text.includes('government')) {
      return EventCategory.GOVERNMENT;
    }

    return EventCategory.GEOPOLITICAL;
  }

  private extractTags(market: ManifoldMarket): string[] {
    const tags: string[] = [];

    const text = `${market.question} ${market.description || ''}`.toLowerCase();

    if (ImpactScorer.impactsSPY({ ...this.transformToEvent(market) })) {
      tags.push('SPY');
    }

    if (ImpactScorer.impactsQQQ({ ...this.transformToEvent(market) })) {
      tags.push('QQQ');
    }

    if (text.includes('volatility') || text.includes('vix')) {
      tags.push('volatility');
    }

    return tags;
  }

  private isRelevantMarket(market: ManifoldMarket): boolean {
    // Filter for binary markets only (easier to work with probabilities)
    if (market.outcomeType !== 'BINARY') {
      return false;
    }

    // Filter for markets with reasonable volume (play money but still indicative)
    if (market.volume < 100) {
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
      'stock',
      'spy',
      'qqq',
      'shutdown',
      'congress',
      'president',
    ];

    return keywords.some((keyword) => text.includes(keyword));
  }
}
