/**
 * Market impact scoring service
 * Calculates SPY/QQQ impact for events
 */

import { PredictionMarketEvent, ImpactScore, ImpactLevel, EventCategory, MarketOdds } from '@/types/market';
import { differenceInDays } from 'date-fns';

export class ImpactScorer {
  /**
   * Calculate market impact score for an event
   */
  static calculateImpact(
    event: PredictionMarketEvent,
    odds: MarketOdds[] = []
  ): ImpactScore {
    let score = 0;
    const factors = {
      category: 0,
      proximity: 0,
      uncertainty: 0,
      volume: 0,
    };

    // Base score by category
    factors.category = this.getCategoryScore(event.category);
    score = factors.category;

    // Boost for proximity
    factors.proximity = this.getProximityMultiplier(event.closeDate);
    score *= factors.proximity;

    // Boost for high uncertainty (indicates volatility potential)
    factors.uncertainty = this.getUncertaintyMultiplier(odds);
    score *= factors.uncertainty;

    // Boost for high volume/liquidity
    factors.volume = this.getVolumeMultiplier(odds);
    score *= factors.volume;

    // Cap at 100
    const finalScore = Math.min(100, Math.round(score));

    return {
      score: finalScore,
      level: this.getImpactLevel(finalScore),
      factors,
    };
  }

  /**
   * Get base score by event category
   */
  private static getCategoryScore(category: EventCategory): number {
    const scores: Partial<Record<EventCategory, number>> = {
      // Core categories
      [EventCategory.FED_POLICY]: 90,
      [EventCategory.ECONOMIC_DATA]: 75,
      [EventCategory.RECESSION]: 85,
      [EventCategory.VOLATILITY]: 70,

      // Political
      [EventCategory.ELECTION]: 60,
      [EventCategory.GOVERNMENT]: 40,
      [EventCategory.GEOPOLITICAL]: 50,

      // Corporate & regulatory
      [EventCategory.CORPORATE]: 45,
      [EventCategory.REGULATORY]: 55,

      // Sector-specific
      [EventCategory.TECH]: 50,
      [EventCategory.HEALTHCARE]: 45,
      [EventCategory.ENERGY]: 50,
      [EventCategory.FINANCIALS]: 55,

      // Additional
      [EventCategory.CLIMATE]: 30,
      [EventCategory.CRYPTO]: 40,
      [EventCategory.SPORTS]: 10, // Sentiment indicator only
    };
    return scores[category] || 30;
  }

  /**
   * Get proximity multiplier (events closer in time have higher impact)
   */
  private static getProximityMultiplier(closeDate: Date): number {
    const daysUntil = differenceInDays(closeDate, new Date());

    if (daysUntil <= 1) return 1.5;
    if (daysUntil <= 7) return 1.3;
    if (daysUntil <= 30) return 1.1;
    return 1.0;
  }

  /**
   * Get uncertainty multiplier (high uncertainty = high volatility potential)
   */
  private static getUncertaintyMultiplier(odds: MarketOdds[]): number {
    if (odds.length === 0) return 1.0;

    // Calculate how close probabilities are to 50% (maximum uncertainty)
    const avgProb = odds.reduce((sum, o) => sum + o.probability, 0) / odds.length;
    const distanceFrom50 = Math.abs(0.5 - avgProb);

    // Uncertainty is high when probability is near 50%
    const uncertainty = 1 - distanceFrom50 * 2;

    if (uncertainty > 0.6) return 1.2;
    if (uncertainty > 0.4) return 1.1;
    return 1.0;
  }

  /**
   * Get volume multiplier (high volume = more market attention)
   */
  private static getVolumeMultiplier(odds: MarketOdds[]): number {
    if (odds.length === 0) return 1.0;

    const avgVolume = odds.reduce((sum, o) => sum + (o.volume || 0), 0) / odds.length;

    if (avgVolume > 10000000) return 1.2; // $10M+
    if (avgVolume > 1000000) return 1.1;  // $1M+
    return 1.0;
  }

  /**
   * Convert score to impact level
   */
  private static getImpactLevel(score: number): ImpactLevel {
    if (score >= 80) return ImpactLevel.CRITICAL;
    if (score >= 60) return ImpactLevel.HIGH;
    if (score >= 40) return ImpactLevel.MEDIUM;
    return ImpactLevel.LOW;
  }

  /**
   * Check if event likely impacts SPY (S&P 500)
   */
  static impactsSPY(event: PredictionMarketEvent): boolean {
    const { category } = event;

    // High-impact categories for SPY
    const spyCategories = [
      EventCategory.FED_POLICY,
      EventCategory.ECONOMIC_DATA,
      EventCategory.RECESSION,
      EventCategory.VOLATILITY,
      EventCategory.ELECTION,
      EventCategory.GOVERNMENT,
      EventCategory.GEOPOLITICAL,
    ];

    if (spyCategories.includes(category)) {
      return true;
    }

    // Keyword-based detection
    const impactKeywords = [
      'election',
      'fed',
      'federal reserve',
      'fomc',
      'shutdown',
      'recession',
      'crisis',
      'rate',
      'interest rate',
      'cpi',
      'inflation',
      'jobs',
      'unemployment',
      'gdp',
      'economy',
      'market',
      's&p 500',
      'spy',
      'earnings',
      'tariff',
      'trade',
      'war',
    ];

    const text = `${event.title} ${event.description}`.toLowerCase();
    return impactKeywords.some((keyword) => text.includes(keyword));
  }

  /**
   * Check if event likely impacts QQQ (Nasdaq-100, tech-heavy)
   */
  static impactsQQQ(event: PredictionMarketEvent): boolean {
    const { category } = event;

    // High-impact categories for QQQ
    const qqqCategories = [
      EventCategory.TECH,
      EventCategory.CRYPTO,
      EventCategory.FED_POLICY,
      EventCategory.REGULATORY,
      EventCategory.RECESSION,
      EventCategory.VOLATILITY,
    ];

    if (qqqCategories.includes(category)) {
      return true;
    }

    // Keyword-based detection (tech-focused)
    const impactKeywords = [
      'tech',
      'technology',
      'regulation',
      'antitrust',
      'ai',
      'artificial intelligence',
      'semiconductor',
      'chip',
      'election',
      'fed',
      'rate',
      'china',
      'crypto',
      'bitcoin',
      'ethereum',
      'nasdaq',
      'qqq',
      'apple',
      'microsoft',
      'google',
      'amazon',
      'meta',
      'nvidia',
      'tesla',
      'data',
      'privacy',
      'cyber',
    ];

    const text = `${event.title} ${event.description}`.toLowerCase();
    return impactKeywords.some((keyword) => text.includes(keyword));
  }
}
