/**
 * Time-based filtering utilities for prediction market events
 */

import { PredictionMarketEvent, TimeHorizon } from '@/types/market';
import { addDays, addMonths, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';

export class TimeFilter {
  /**
   * Filter events by time horizon
   */
  static filterByTimeHorizon(
    events: PredictionMarketEvent[],
    horizon: TimeHorizon
  ): PredictionMarketEvent[] {
    const now = new Date();
    let startDate = now;
    let endDate: Date;

    switch (horizon) {
      case TimeHorizon.NEXT_7_DAYS:
        endDate = addDays(now, 7);
        break;

      case TimeHorizon.NEXT_30_DAYS:
        endDate = addDays(now, 30);
        break;

      case TimeHorizon.NEXT_90_DAYS:
        endDate = addDays(now, 90);
        break;

      case TimeHorizon.THIS_QUARTER:
        startDate = startOfQuarter(now);
        endDate = endOfQuarter(now);
        break;

      case TimeHorizon.NEXT_QUARTER:
        const nextQuarterStart = addMonths(endOfQuarter(now), 1);
        startDate = startOfQuarter(nextQuarterStart);
        endDate = endOfQuarter(nextQuarterStart);
        break;

      case TimeHorizon.THIS_YEAR:
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;

      default:
        return events;
    }

    return events.filter((event) => {
      const closeDate = new Date(event.closeDate);
      return closeDate >= startDate && closeDate <= endDate;
    });
  }

  /**
   * Get events in the next N days
   */
  static getUpcomingEvents(events: PredictionMarketEvent[], days: number): PredictionMarketEvent[] {
    const now = new Date();
    const futureDate = addDays(now, days);

    return events.filter((event) => {
      const closeDate = new Date(event.closeDate);
      return closeDate >= now && closeDate <= futureDate;
    });
  }

  /**
   * Get days until event closes
   */
  static getDaysUntilClose(event: PredictionMarketEvent): number {
    const now = new Date();
    const closeDate = new Date(event.closeDate);
    const diffTime = closeDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Check if event is imminent (within 7 days)
   */
  static isImminent(event: PredictionMarketEvent): boolean {
    return this.getDaysUntilClose(event) <= 7;
  }

  /**
   * Check if event is near-term (within 30 days)
   */
  static isNearTerm(event: PredictionMarketEvent): boolean {
    return this.getDaysUntilClose(event) <= 30;
  }

  /**
   * Sort events by proximity (soonest first)
   */
  static sortByProximity(events: PredictionMarketEvent[]): PredictionMarketEvent[] {
    return [...events].sort((a, b) => {
      return new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime();
    });
  }

  /**
   * Group events by time horizon
   */
  static groupByHorizon(events: PredictionMarketEvent[]): Record<string, PredictionMarketEvent[]> {
    const groups = {
      imminent: [] as PredictionMarketEvent[],      // 0-7 days
      nearTerm: [] as PredictionMarketEvent[],      // 8-30 days
      midTerm: [] as PredictionMarketEvent[],       // 31-90 days
      longTerm: [] as PredictionMarketEvent[],      // 90+ days
    };

    for (const event of events) {
      const daysUntil = this.getDaysUntilClose(event);

      if (daysUntil <= 7) {
        groups.imminent.push(event);
      } else if (daysUntil <= 30) {
        groups.nearTerm.push(event);
      } else if (daysUntil <= 90) {
        groups.midTerm.push(event);
      } else {
        groups.longTerm.push(event);
      }
    }

    return groups;
  }

  /**
   * Get cache TTL based on event proximity
   * Imminent events: 1 minute
   * Near-term events: 5 minutes
   * Mid-term events: 15 minutes
   * Long-term events: 60 minutes
   */
  static getCacheTTL(event: PredictionMarketEvent): number {
    const daysUntil = this.getDaysUntilClose(event);

    if (daysUntil <= 7) return 60;      // 1 minute
    if (daysUntil <= 30) return 300;    // 5 minutes
    if (daysUntil <= 90) return 900;    // 15 minutes
    return 3600;                        // 60 minutes
  }
}
