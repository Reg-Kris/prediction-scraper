/**
 * Metaculus API scraper
 * Documentation: https://www.metaculus.com/api2/schema/redoc/
 * Available globally, no authentication required for public questions
 */

import { BasePredictionScraper, EventFilters } from './base-scraper';
import { MarketSource, PredictionMarketEvent, MarketOdds, EventCategory } from '@/types/market';
import { ImpactScorer } from '../services/impact-scorer';

interface MetaculusQuestion {
  id: number;
  title: string;
  description: string;
  url: string;
  status: string;
  type: string;
  resolution: string | null;
  scheduled_close_time: string | null;
  community_prediction?: {
    q2?: number; // Median prediction
  };
  possibilities?: {
    type: string;
    format?: string;
  };
  forecaster_count?: number;
}

interface MetaculusResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: MetaculusQuestion[];
}

export class MetaculusScraper extends BasePredictionScraper {
  constructor() {
    super(
      MarketSource.METACULUS,
      'https://www.metaculus.com/api2',
      { requests: 100, windowMs: 60000 }, // Conservative: 100 req/min
      30000
    );
  }

  async fetchEvents(filters?: EventFilters): Promise<PredictionMarketEvent[]> {
    await this.rateLimiter.wait();

    try {
      const params: Record<string, unknown> = {
        limit: filters?.limit || 50,
        offset: filters?.offset || 0,
        order_by: '-publish_time',
        forecast_type: 'binary', // Focus on binary questions for simplicity
      };

      if (filters?.active === true) {
        params.status = 'open';
      }

      const response = await this.client.get<MetaculusResponse>('/questions/', { params });

      this.log('info', `Fetched ${response.data.results.length} questions`);

      return response.data.results
        .filter((q) => this.isRelevantQuestion(q))
        .map((q) => this.transformToEvent(q));
    } catch (error) {
      this.handleError('fetchEvents', error);
    }
  }

  async fetchOdds(eventId: string): Promise<MarketOdds> {
    await this.rateLimiter.wait();

    try {
      // Extract numeric ID from eventId (format: metaculus-12345)
      const id = eventId.replace('metaculus-', '');
      const response = await this.client.get<MetaculusQuestion>(`/questions/${id}/`);

      return this.transformToOdds(response.data);
    } catch (error) {
      this.handleError('fetchOdds', error);
    }
  }

  async search(query: string): Promise<PredictionMarketEvent[]> {
    await this.rateLimiter.wait();

    try {
      const response = await this.client.get<MetaculusResponse>('/questions/', {
        params: {
          search: query,
          limit: 50,
          forecast_type: 'binary',
        },
      });

      return response.data.results
        .filter((q) => this.isRelevantQuestion(q))
        .map((q) => this.transformToEvent(q));
    } catch (error) {
      this.handleError('search', error);
    }
  }

  private transformToEvent(question: MetaculusQuestion): PredictionMarketEvent {
    const closeDate = question.scheduled_close_time
      ? new Date(question.scheduled_close_time)
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // Default 90 days

    return {
      id: `metaculus-${question.id}`,
      title: question.title,
      description: question.description || '',
      category: this.categorizeEvent(question),
      closeDate,
      resolutionCriteria: question.description,
      tags: this.extractTags(question),
      url: question.url,
    };
  }

  private transformToOdds(question: MetaculusQuestion): MarketOdds {
    // Metaculus community prediction q2 is the median (0-1 for binary)
    const probability = question.community_prediction?.q2 || 0.5;

    return {
      eventId: `metaculus-${question.id}`,
      source: this.source,
      probability,
      lastUpdated: new Date(),
      metadata: {
        status: question.status,
        type: question.type,
        forecasterCount: question.forecaster_count,
        resolution: question.resolution,
      },
    };
  }

  private categorizeEvent(question: MetaculusQuestion): EventCategory {
    const text = `${question.title} ${question.description || ''}`.toLowerCase();

    if (
      text.includes('fed') ||
      text.includes('federal reserve') ||
      text.includes('interest rate') ||
      text.includes('monetary policy')
    ) {
      return EventCategory.FED_POLICY;
    }

    if (
      text.includes('election') ||
      text.includes('presidential') ||
      text.includes('congress') ||
      text.includes('political')
    ) {
      return EventCategory.ELECTION;
    }

    if (
      text.includes('gdp') ||
      text.includes('inflation') ||
      text.includes('cpi') ||
      text.includes('unemployment') ||
      text.includes('economic')
    ) {
      return EventCategory.ECONOMIC_DATA;
    }

    if (text.includes('government') || text.includes('policy')) {
      return EventCategory.GOVERNMENT;
    }

    return EventCategory.GEOPOLITICAL;
  }

  private extractTags(question: MetaculusQuestion): string[] {
    const tags: string[] = ['metaculus', 'forecast'];

    const event = this.transformToEvent(question);

    if (ImpactScorer.impactsSPY(event)) {
      tags.push('SPY');
    }

    if (ImpactScorer.impactsQQQ(event)) {
      tags.push('QQQ');
    }

    return tags;
  }

  private isRelevantQuestion(question: MetaculusQuestion): boolean {
    // Only binary questions for now
    if (question.type !== 'forecast') {
      return false;
    }

    // Must have a community prediction
    if (!question.community_prediction) {
      return false;
    }

    // Check if question is related to finance/economics/politics
    const text = `${question.title} ${question.description || ''}`.toLowerCase();
    const keywords = [
      'economy',
      'economic',
      'market',
      'fed',
      'federal reserve',
      'interest rate',
      'inflation',
      'gdp',
      'unemployment',
      'election',
      'president',
      'congress',
      'government',
      'financial',
      'stock',
    ];

    return keywords.some((keyword) => text.includes(keyword));
  }
}
