/**
 * MetaForecast GraphQL API client
 * Documentation: https://metaforecast.org
 * GraphQL Endpoint: https://metaforecast.org/api/graphql
 *
 * MetaForecast aggregates predictions from 10+ platforms:
 * - Polymarket, Kalshi, Metaculus, Manifold, PredictIt, and more
 *
 * Advantages:
 * - Single API for multiple prediction markets
 * - Free and open-source
 * - No authentication required
 * - No rate limiting (community platform)
 */

import axios, { AxiosInstance } from 'axios';
import { MarketSource, PredictionMarketEvent, MarketOdds, EventCategory } from '@/types/market';
import { ImpactScorer } from '../services/impact-scorer';

interface MetaForecastQuestion {
  id: string;
  title: string;
  url: string;
  description: string;
  platform: string;
  options: Array<{
    name: string;
    probability: number;
  }>;
  qualityIndicators: {
    numForecasts?: number;
    stars?: number;
  };
  timestamp: string;
}

interface MetaForecastResponse {
  data: {
    questions: {
      edges: Array<{
        node: MetaForecastQuestion;
      }>;
    };
  };
}

export class MetaForecastScraper {
  private readonly client: AxiosInstance;
  private readonly endpoint = 'https://metaforecast.org/api/graphql';

  constructor() {
    this.client = axios.create({
      baseURL: this.endpoint,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Fetch prediction market events with optional filters
   */
  async fetchEvents(options?: {
    searchText?: string;
    limit?: number;
    platforms?: string[];
  }): Promise<PredictionMarketEvent[]> {
    const { searchText, limit = 100, platforms } = options || {};

    const query = `
      query GetQuestions($first: Int!) {
        questions(first: $first) {
          edges {
            node {
              id
              title
              url
              description
              platform
              options {
                name
                probability
              }
              qualityIndicators {
                numForecasts
                stars
              }
              timestamp
            }
          }
        }
      }
    `;

    try {
      const response = await this.client.post<MetaForecastResponse>('', {
        query,
        variables: { first: limit },
      });

      if (!response.data?.data?.questions?.edges) {
        console.warn('MetaForecast: No data returned');
        return [];
      }

      let questions = response.data.data.questions.edges.map((edge) => edge.node);

      // Apply filters
      if (searchText) {
        const lowerSearch = searchText.toLowerCase();
        questions = questions.filter(
          (q) =>
            q.title.toLowerCase().includes(lowerSearch) ||
            q.description.toLowerCase().includes(lowerSearch)
        );
      }

      if (platforms && platforms.length > 0) {
        questions = questions.filter((q) => platforms.includes(q.platform));
      }

      // Filter for relevant financial/political markets
      questions = questions.filter((q) => this.isRelevantQuestion(q));

      return questions.map((q) => this.transformToEvent(q));
    } catch (error) {
      console.error('MetaForecast fetchEvents error:', error);
      return [];
    }
  }

  /**
   * Search for specific markets by keywords
   */
  async search(query: string): Promise<PredictionMarketEvent[]> {
    return this.fetchEvents({ searchText: query, limit: 100 });
  }

  /**
   * Fetch markets by category
   */
  async fetchByCategory(category: EventCategory, limit = 50): Promise<PredictionMarketEvent[]> {
    const searchTerms = this.getCategorySearchTerms(category);

    const allEvents: PredictionMarketEvent[] = [];

    // Search for each term and combine results
    for (const term of searchTerms) {
      const events = await this.fetchEvents({ searchText: term, limit: limit / searchTerms.length });
      allEvents.push(...events);
    }

    // Deduplicate by ID
    const uniqueEvents = Array.from(
      new Map(allEvents.map((e) => [e.id, e])).values()
    );

    return uniqueEvents.filter((e) => e.category === category);
  }

  /**
   * Fetch odds for a specific event
   */
  async fetchOdds(eventId: string): Promise<MarketOdds | null> {
    // Extract the original MetaForecast ID
    const id = eventId.replace('metaforecast-', '');

    const query = `
      query GetQuestion($id: String!) {
        question(id: $id) {
          id
          title
          platform
          options {
            name
            probability
          }
          qualityIndicators {
            numForecasts
          }
          timestamp
        }
      }
    `;

    try {
      const response = await this.client.post('', {
        query,
        variables: { id },
      });

      const question = response.data?.data?.question;
      if (!question) {
        return null;
      }

      return this.transformToOdds(question);
    } catch (error) {
      console.error('MetaForecast fetchOdds error:', error);
      return null;
    }
  }

  /**
   * Transform MetaForecast question to our event format
   */
  private transformToEvent(question: MetaForecastQuestion): PredictionMarketEvent {
    return {
      id: `metaforecast-${question.id}`,
      title: question.title,
      description: question.description || '',
      category: this.categorizeEvent(question),
      closeDate: new Date(question.timestamp || Date.now() + 90 * 24 * 60 * 60 * 1000),
      resolutionCriteria: question.description,
      tags: this.extractTags(question),
      url: question.url,
    };
  }

  /**
   * Transform MetaForecast question to odds format
   */
  private transformToOdds(question: MetaForecastQuestion): MarketOdds {
    // For binary questions, use first option probability
    const probability = question.options?.[0]?.probability || 0.5;

    return {
      eventId: `metaforecast-${question.id}`,
      source: this.mapPlatformToSource(question.platform),
      probability,
      lastUpdated: new Date(question.timestamp),
      metadata: {
        platform: question.platform,
        numForecasts: question.qualityIndicators?.numForecasts,
        stars: question.qualityIndicators?.stars,
        options: question.options,
      },
    };
  }

  /**
   * Map MetaForecast platform names to our MarketSource enum
   */
  private mapPlatformToSource(platform: string): MarketSource {
    const platformMap: Record<string, MarketSource> = {
      polymarket: MarketSource.POLYMARKET,
      kalshi: MarketSource.KALSHI,
      metaculus: MarketSource.METACULUS,
      manifold: MarketSource.MANIFOLD,
      predictit: MarketSource.PREDICTIT,
    };

    return platformMap[platform.toLowerCase()] || MarketSource.METACULUS;
  }

  /**
   * Categorize event based on content
   */
  private categorizeEvent(question: MetaForecastQuestion): EventCategory {
    const text = `${question.title} ${question.description || ''}`.toLowerCase();

    if (
      text.includes('fed') ||
      text.includes('federal reserve') ||
      text.includes('interest rate') ||
      text.includes('fomc') ||
      text.includes('monetary policy')
    ) {
      return EventCategory.FED_POLICY;
    }

    if (
      text.includes('election') ||
      text.includes('presidential') ||
      text.includes('congress') ||
      text.includes('senate') ||
      text.includes('political')
    ) {
      return EventCategory.ELECTION;
    }

    if (
      text.includes('gdp') ||
      text.includes('inflation') ||
      text.includes('cpi') ||
      text.includes('unemployment') ||
      text.includes('jobs report') ||
      text.includes('economic')
    ) {
      return EventCategory.ECONOMIC_DATA;
    }

    if (
      text.includes('government') ||
      text.includes('shutdown') ||
      text.includes('policy')
    ) {
      return EventCategory.GOVERNMENT;
    }

    return EventCategory.GEOPOLITICAL;
  }

  /**
   * Extract relevant tags
   */
  private extractTags(question: MetaForecastQuestion): string[] {
    const tags: string[] = ['metaforecast', question.platform];

    const event = this.transformToEvent(question);

    if (ImpactScorer.impactsSPY(event)) {
      tags.push('SPY');
    }

    if (ImpactScorer.impactsQQQ(event)) {
      tags.push('QQQ');
    }

    // Add quality indicators as tags
    if (question.qualityIndicators?.stars && question.qualityIndicators.stars >= 3) {
      tags.push('high-quality');
    }

    return tags;
  }

  /**
   * Check if question is relevant for financial markets
   */
  private isRelevantQuestion(question: MetaForecastQuestion): boolean {
    const text = `${question.title} ${question.description || ''}`.toLowerCase();

    const keywords = [
      'fed',
      'federal reserve',
      'interest rate',
      'fomc',
      'election',
      'economy',
      'gdp',
      'inflation',
      'cpi',
      'jobs',
      'unemployment',
      'market',
      'spy',
      'qqq',
      'shutdown',
      'congress',
      'president',
      'policy',
      'recession',
      'economic',
      'financial',
    ];

    return keywords.some((keyword) => text.includes(keyword));
  }

  /**
   * Get search terms for a category
   */
  private getCategorySearchTerms(category: EventCategory): string[] {
    const searchTerms: Record<EventCategory, string[]> = {
      [EventCategory.FED_POLICY]: ['federal reserve', 'fed', 'interest rate', 'fomc'],
      [EventCategory.ECONOMIC_DATA]: ['gdp', 'inflation', 'cpi', 'jobs', 'unemployment'],
      [EventCategory.ELECTION]: ['election', 'presidential', 'congress', 'senate'],
      [EventCategory.GOVERNMENT]: ['government', 'shutdown', 'policy'],
      [EventCategory.GEOPOLITICAL]: ['war', 'china', 'russia', 'trade'],
    };

    return searchTerms[category] || [];
  }

  /**
   * Get available platforms from MetaForecast
   */
  async getAvailablePlatforms(): Promise<string[]> {
    const events = await this.fetchEvents({ limit: 100 });
    const platforms = new Set(
      events.map((e) => e.tags.find((t) => t !== 'metaforecast' && t !== 'SPY' && t !== 'QQQ'))
    );
    return Array.from(platforms).filter((p): p is string => !!p);
  }
}
