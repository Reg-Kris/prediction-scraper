/**
 * Base scraper class that all market scrapers extend
 */

import { MarketSource, PredictionMarketEvent, MarketOdds } from '@/types/market';
import { RateLimiter } from '../utils/rate-limiter';
import axios, { AxiosInstance, AxiosError } from 'axios';

export abstract class BasePredictionScraper {
  protected readonly source: MarketSource;
  protected readonly client: AxiosInstance;
  protected readonly rateLimiter: RateLimiter;

  constructor(
    source: MarketSource,
    baseURL: string,
    rateLimit: { requests: number; windowMs: number },
    timeout: number = 30000
  ) {
    this.source = source;

    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        'User-Agent': 'prediction-scraper/1.0',
        'Accept': 'application/json',
      },
    });

    this.rateLimiter = new RateLimiter(rateLimit.requests, rateLimit.windowMs);
  }

  /**
   * Fetch events from this source
   */
  abstract fetchEvents(filters?: EventFilters): Promise<PredictionMarketEvent[]>;

  /**
   * Fetch odds for a specific event
   */
  abstract fetchOdds(eventId: string): Promise<MarketOdds>;

  /**
   * Search for events
   */
  abstract search(query: string): Promise<PredictionMarketEvent[]>;

  /**
   * Handle errors consistently
   */
  protected handleError(method: string, error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response?.status === 429) {
        throw new ScraperError(
          this.source,
          `Rate limit exceeded in ${method}`,
          true,
          axiosError
        );
      } else if (axiosError.response?.status === 404) {
        throw new ScraperError(
          this.source,
          `Resource not found in ${method}`,
          false,
          axiosError
        );
      } else if (axiosError.response?.status && axiosError.response.status >= 500) {
        throw new ScraperError(
          this.source,
          `Server error in ${method}`,
          true,
          axiosError
        );
      }
    }

    throw new ScraperError(
      this.source,
      `Unexpected error in ${method}: ${error}`,
      false,
      error as Error
    );
  }

  /**
   * Log scraper activity
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${this.source}] ${message}`;

    if (level === 'error') {
      console.error(logMessage, data);
    } else if (level === 'warn') {
      console.warn(logMessage, data);
    } else {
      console.log(logMessage, data);
    }
  }
}

/**
 * Scraper-specific error class
 */
export class ScraperError extends Error {
  constructor(
    public source: MarketSource,
    message: string,
    public isRetryable: boolean = true,
    public originalError?: Error
  ) {
    super(`[${source}] ${message}`);
    this.name = 'ScraperError';
  }
}

/**
 * Filters for event queries
 */
export interface EventFilters {
  category?: string;
  tags?: string[];
  active?: boolean;
  limit?: number;
  offset?: number;
}
