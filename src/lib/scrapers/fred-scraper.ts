/**
 * FRED (Federal Reserve Economic Data) API scraper
 * Documentation: https://fred.stlouisfed.org/docs/api/fred/
 * Requires free API key: https://fred.stlouisfed.org/docs/api/api_key.html
 * Globally accessible
 */

import { BasePredictionScraper, EventFilters } from './base-scraper';
import { MarketSource, PredictionMarketEvent, MarketOdds, EventCategory } from '@/types/market';

interface FredSeries {
  id: string;
  realtime_start: string;
  realtime_end: string;
  title: string;
  observation_start: string;
  observation_end: string;
  frequency: string;
  frequency_short: string;
  units: string;
  seasonal_adjustment: string;
  last_updated: string;
  popularity: number;
  notes?: string;
}

interface FredSeriesResponse {
  realtime_start: string;
  realtime_end: string;
  seriess: FredSeries[];
}

interface FredObservation {
  realtime_start: string;
  realtime_end: string;
  date: string;
  value: string;
}

interface FredObservationsResponse {
  realtime_start: string;
  realtime_end: string;
  observation_start: string;
  observation_end: string;
  units: string;
  output_type: number;
  file_type: string;
  order_by: string;
  sort_order: string;
  count: number;
  offset: number;
  limit: number;
  observations: FredObservation[];
}

export class FredScraper extends BasePredictionScraper {
  private readonly apiKey: string;

  // Key economic indicators to track
  private readonly KEY_SERIES = {
    CPI: 'CPIAUCSL', // Consumer Price Index
    UNEMPLOYMENT: 'UNRATE', // Unemployment Rate
    GDP: 'GDP', // Gross Domestic Product
    FED_FUNDS: 'FEDFUNDS', // Effective Federal Funds Rate
    PAYROLL: 'PAYEMS', // Nonfarm Payrolls
    CORE_CPI: 'CPILFESL', // Core CPI
  };

  constructor(apiKey?: string) {
    super(
      MarketSource.FRED,
      'https://api.stlouisfed.org/fred',
      { requests: 100, windowMs: 60000 }, // Very generous limit
      30000
    );

    this.apiKey = apiKey || process.env.FRED_API_KEY || '';

    if (!this.apiKey) {
      this.log(
        'warn',
        'FRED API key not provided. Get one at https://fred.stlouisfed.org/docs/api/api_key.html'
      );
    }
  }

  async fetchEvents(filters?: EventFilters): Promise<PredictionMarketEvent[]> {
    if (!this.apiKey) {
      this.log('error', 'FRED API key required');
      return [];
    }

    await this.rateLimiter.wait();

    try {
      const events: PredictionMarketEvent[] = [];

      // For each key series, create an "event" for the next release
      for (const [name, seriesId] of Object.entries(this.KEY_SERIES)) {
        const seriesInfo = await this.getSeriesInfo(seriesId);
        if (seriesInfo) {
          events.push(this.createEventFromSeries(name, seriesInfo));
        }
      }

      this.log('info', `Created ${events.length} economic indicator events`);

      return events;
    } catch (error) {
      this.handleError('fetchEvents', error);
    }
  }

  async fetchOdds(eventId: string): Promise<MarketOdds> {
    if (!this.apiKey) {
      throw new Error('FRED API key required');
    }

    await this.rateLimiter.wait();

    try {
      // Extract series ID from eventId (format: fred-CPIAUCSL)
      const seriesId = eventId.replace('fred-', '');

      // Get latest observation
      const observations = await this.getLatestObservations(seriesId, 1);

      if (!observations || observations.length === 0) {
        throw new Error(`No observations found for series ${seriesId}`);
      }

      const latest = observations[0];
      const value = parseFloat(latest.value);

      // FRED doesn't provide probabilities, so we return the actual value
      // This can be used for context in the dashboard
      return {
        eventId,
        source: this.source,
        probability: 0, // Not applicable for FRED
        lastUpdated: new Date(latest.date),
        metadata: {
          value,
          units: latest.realtime_start,
          date: latest.date,
        },
      };
    } catch (error) {
      this.handleError('fetchOdds', error);
    }
  }

  async search(query: string): Promise<PredictionMarketEvent[]> {
    // FRED search would require series search API
    // For now, just return relevant key series
    return this.fetchEvents();
  }

  /**
   * Get series information
   */
  private async getSeriesInfo(seriesId: string): Promise<FredSeries | null> {
    try {
      const response = await this.client.get<FredSeriesResponse>('/series', {
        params: {
          series_id: seriesId,
          api_key: this.apiKey,
          file_type: 'json',
        },
      });

      return response.data.seriess[0] || null;
    } catch (error) {
      this.log('error', `Failed to get series info for ${seriesId}`, error);
      return null;
    }
  }

  /**
   * Get latest observations for a series
   */
  private async getLatestObservations(
    seriesId: string,
    limit: number = 10
  ): Promise<FredObservation[] | null> {
    try {
      const response = await this.client.get<FredObservationsResponse>('/series/observations', {
        params: {
          series_id: seriesId,
          api_key: this.apiKey,
          file_type: 'json',
          sort_order: 'desc',
          limit,
        },
      });

      return response.data.observations;
    } catch (error) {
      this.log('error', `Failed to get observations for ${seriesId}`, error);
      return null;
    }
  }

  /**
   * Create a prediction event from FRED series
   */
  private createEventFromSeries(name: string, series: FredSeries): PredictionMarketEvent {
    // Estimate next release date based on frequency
    const nextRelease = this.estimateNextRelease(series.frequency_short, series.last_updated);

    return {
      id: `fred-${series.id}`,
      title: `${series.title} Release`,
      description: series.notes || `Next ${series.title} data release`,
      category: EventCategory.ECONOMIC_DATA,
      closeDate: nextRelease,
      resolutionCriteria: `Official ${series.title} release from FRED`,
      tags: ['FRED', 'economic-data', 'SPY', 'QQQ', name.toLowerCase()],
      url: `https://fred.stlouisfed.org/series/${series.id}`,
    };
  }

  /**
   * Estimate next release date based on frequency
   */
  private estimateNextRelease(frequency: string, lastUpdated: string): Date {
    const last = new Date(lastUpdated);
    const next = new Date(last);

    switch (frequency) {
      case 'M': // Monthly
        next.setMonth(next.getMonth() + 1);
        break;
      case 'Q': // Quarterly
        next.setMonth(next.getMonth() + 3);
        break;
      case 'A': // Annual
        next.setFullYear(next.getFullYear() + 1);
        break;
      case 'W': // Weekly
        next.setDate(next.getDate() + 7);
        break;
      case 'D': // Daily
        next.setDate(next.getDate() + 1);
        break;
      default:
        // Default to 30 days
        next.setDate(next.getDate() + 30);
    }

    return next;
  }
}
