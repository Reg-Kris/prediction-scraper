/**
 * Volatility and uncertainty calculation utilities
 * High uncertainty (50/50 odds) correlates with potential VIX spikes
 */

import { MarketOdds, VolatilityLevel, AggregatedOdds } from '@/types/market';

export class VolatilityCalculator {
  /**
   * Calculate uncertainty score (0-1)
   * Higher score = more uncertain = potential for higher volatility
   * Maximum uncertainty at 50% probability
   */
  static calculateUncertainty(probability: number): number {
    // Distance from 50% (maximum uncertainty point)
    const distanceFrom50 = Math.abs(0.5 - probability);

    // Invert so that 50% = 1.0 (max uncertainty), 0% or 100% = 0.0 (no uncertainty)
    const uncertainty = 1 - distanceFrom50 * 2;

    return Math.max(0, Math.min(1, uncertainty));
  }

  /**
   * Calculate uncertainty from multiple odds sources
   */
  static calculateAggregatedUncertainty(odds: MarketOdds[]): number {
    if (odds.length === 0) return 0;

    const avgProb = odds.reduce((sum, o) => sum + o.probability, 0) / odds.length;
    return this.calculateUncertainty(avgProb);
  }

  /**
   * Get volatility level classification
   */
  static getVolatilityLevel(probability: number): VolatilityLevel {
    const uncertainty = this.calculateUncertainty(probability);

    if (uncertainty >= 0.9) return VolatilityLevel.VERY_HIGH;  // 45-55% range
    if (uncertainty >= 0.7) return VolatilityLevel.HIGH;       // 35-65% range
    if (uncertainty >= 0.5) return VolatilityLevel.MODERATE;   // 25-75% range
    return VolatilityLevel.LOW;
  }

  /**
   * Calculate disagreement between sources (higher = more volatility potential)
   */
  static calculateDisagreement(odds: MarketOdds[]): number {
    if (odds.length < 2) return 0;

    const probabilities = odds.map((o) => o.probability);
    const mean = probabilities.reduce((sum, p) => sum + p, 0) / probabilities.length;

    // Calculate standard deviation
    const squaredDiffs = probabilities.map((p) => Math.pow(p - mean, 2));
    const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / probabilities.length;
    const stdDev = Math.sqrt(variance);

    // Normalize to 0-1 range (max stdDev for binary outcome is ~0.5)
    return Math.min(1, stdDev * 2);
  }

  /**
   * Estimate VIX correlation potential
   * Events with high uncertainty and high impact tend to move VIX
   */
  static estimateVIXCorrelation(event: AggregatedOdds): number {
    const uncertainty = this.calculateAggregatedUncertainty(event.odds);
    const disagreement = this.calculateDisagreement(event.odds);
    const impactNormalized = event.impactScore.score / 100;

    // Weighted combination
    const vixCorrelation =
      uncertainty * 0.4 +         // How close to 50/50
      disagreement * 0.3 +        // How much sources disagree
      impactNormalized * 0.3;     // How impactful the event is

    return Math.min(1, vixCorrelation);
  }

  /**
   * Filter for high volatility events (potential VIX movers)
   */
  static filterHighVolatilityEvents(events: AggregatedOdds[]): AggregatedOdds[] {
    return events.filter((event) => {
      const vixCorrelation = this.estimateVIXCorrelation(event);
      return vixCorrelation >= 0.6; // High VIX potential
    });
  }

  /**
   * Get events with 50/50 odds (maximum uncertainty)
   */
  static get5050Events(events: AggregatedOdds[], tolerance: number = 0.1): AggregatedOdds[] {
    return events.filter((event) => {
      const prob = event.aggregatedProbability;
      return prob >= 0.5 - tolerance && prob <= 0.5 + tolerance;
    });
  }

  /**
   * Calculate expected volatility impact
   * Combines uncertainty with impact score and proximity
   */
  static calculateVolatilityImpact(event: AggregatedOdds, daysUntilClose: number): number {
    const uncertainty = this.calculateAggregatedUncertainty(event.odds);
    const impactNormalized = event.impactScore.score / 100;

    // Proximity multiplier (closer events = higher impact)
    let proximityMultiplier = 1.0;
    if (daysUntilClose <= 1) proximityMultiplier = 2.0;
    else if (daysUntilClose <= 7) proximityMultiplier = 1.5;
    else if (daysUntilClose <= 30) proximityMultiplier = 1.2;

    const volatilityImpact = uncertainty * impactNormalized * proximityMultiplier;

    return Math.min(1, volatilityImpact);
  }

  /**
   * Get volatility summary statistics
   */
  static getVolatilitySummary(events: AggregatedOdds[]): {
    avgUncertainty: number;
    highVolatilityCount: number;
    veryHighVolatilityCount: number;
    top5050Events: AggregatedOdds[];
  } {
    const uncertainties = events.map((e) =>
      this.calculateAggregatedUncertainty(e.odds)
    );

    const avgUncertainty =
      uncertainties.reduce((sum, u) => sum + u, 0) / (uncertainties.length || 1);

    const volatilityLevels = events.map((e) =>
      this.getVolatilityLevel(e.aggregatedProbability)
    );

    const highVolatilityCount = volatilityLevels.filter(
      (v) => v === VolatilityLevel.HIGH
    ).length;

    const veryHighVolatilityCount = volatilityLevels.filter(
      (v) => v === VolatilityLevel.VERY_HIGH
    ).length;

    const top5050Events = this.get5050Events(events)
      .sort((a, b) => b.impactScore.score - a.impactScore.score)
      .slice(0, 5);

    return {
      avgUncertainty,
      highVolatilityCount,
      veryHighVolatilityCount,
      top5050Events,
    };
  }
}
