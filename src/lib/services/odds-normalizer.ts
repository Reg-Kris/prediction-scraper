/**
 * Odds normalization service
 * Converts different probability formats to decimal (0-1)
 */

export type OddsFormat = 'decimal' | 'percentage' | 'fractional' | 'american';

export class OddsNormalizer {
  /**
   * Convert any odds format to decimal (0-1)
   */
  static toDecimal(value: number | string, format: OddsFormat): number {
    switch (format) {
      case 'decimal':
        return typeof value === 'number' ? value : parseFloat(value);

      case 'percentage':
        return (typeof value === 'number' ? value : parseFloat(value)) / 100;

      case 'fractional': {
        const [num, den] = String(value).split('/').map(Number);
        if (!num || !den) throw new Error(`Invalid fractional odds: ${value}`);
        return den / (num + den);
      }

      case 'american':
        return this.americanToDecimal(Number(value));

      default:
        throw new Error(`Unknown odds format: ${format}`);
    }
  }

  /**
   * Convert American odds to decimal probability
   */
  private static americanToDecimal(odds: number): number {
    if (odds > 0) {
      return 100 / (odds + 100);
    } else {
      return Math.abs(odds) / (Math.abs(odds) + 100);
    }
  }

  /**
   * Validate probability is within valid range
   */
  static validate(probability: number): boolean {
    return probability >= 0 && probability <= 1;
  }

  /**
   * Clamp probability to valid range
   */
  static clamp(probability: number): number {
    return Math.max(0, Math.min(1, probability));
  }
}
