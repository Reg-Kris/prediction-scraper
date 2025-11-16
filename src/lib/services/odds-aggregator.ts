/**
 * Odds aggregation service
 * Combines probabilities from multiple sources
 */

import { MarketOdds } from '@/types/market';

export class OddsAggregator {
  /**
   * Simple average - use when sources equally reliable
   */
  static average(odds: MarketOdds[]): number {
    if (odds.length === 0) return 0;
    const sum = odds.reduce((acc, o) => acc + o.probability, 0);
    return sum / odds.length;
  }

  /**
   * Weighted average - weight by volume/liquidity
   */
  static weightedAverage(odds: MarketOdds[]): number {
    if (odds.length === 0) return 0;

    const totalVolume = odds.reduce((acc, o) => acc + (o.volume || 0), 0);

    // Fallback to simple average if no volume data
    if (totalVolume === 0) {
      return this.average(odds);
    }

    const weighted = odds.reduce((acc, o) => {
      const weight = (o.volume || 0) / totalVolume;
      return acc + o.probability * weight;
    }, 0);

    return weighted;
  }

  /**
   * Median - robust to outliers
   */
  static median(odds: MarketOdds[]): number {
    if (odds.length === 0) return 0;

    const sorted = [...odds].sort((a, b) => a.probability - b.probability);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1].probability + sorted[mid].probability) / 2;
    }
    return sorted[mid].probability;
  }

  /**
   * Calculate confidence (measure of agreement)
   * Returns value between 0 and 1
   * High confidence = low standard deviation
   */
  static calculateConfidence(odds: MarketOdds[]): number {
    if (odds.length < 2) return 1.0;

    const avg = this.average(odds);
    const variance =
      odds.reduce((acc, o) => {
        return acc + Math.pow(o.probability - avg, 2);
      }, 0) / odds.length;

    const stdDev = Math.sqrt(variance);

    // High confidence when standard deviation is low
    // Return value between 0 and 1
    return Math.max(0, 1 - stdDev * 2);
  }

  /**
   * Get recommended aggregation method based on data
   */
  static aggregate(odds: MarketOdds[]): {
    probability: number;
    confidence: number;
    method: 'average' | 'weighted' | 'median';
  } {
    if (odds.length === 0) {
      return { probability: 0, confidence: 0, method: 'average' };
    }

    if (odds.length === 1) {
      return {
        probability: odds[0].probability,
        confidence: 1,
        method: 'average',
      };
    }

    // Use weighted average if we have volume data
    const hasVolume = odds.some((o) => o.volume && o.volume > 0);
    if (hasVolume) {
      return {
        probability: this.weightedAverage(odds),
        confidence: this.calculateConfidence(odds),
        method: 'weighted',
      };
    }

    // Use median if we have many sources (more robust)
    if (odds.length >= 4) {
      return {
        probability: this.median(odds),
        confidence: this.calculateConfidence(odds),
        method: 'median',
      };
    }

    // Default to simple average
    return {
      probability: this.average(odds),
      confidence: this.calculateConfidence(odds),
      method: 'average',
    };
  }
}
