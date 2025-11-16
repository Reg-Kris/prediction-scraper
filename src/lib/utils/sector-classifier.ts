/**
 * Sector classification utility
 * Maps events to market sectors based on keywords and context
 */

import { MarketSector, PredictionMarketEvent, EventCategory } from '@/types/market';

export class SectorClassifier {
  /**
   * Classify which sectors an event affects
   */
  static classifySectors(event: PredictionMarketEvent): MarketSector[] {
    const sectors: Set<MarketSector> = new Set();
    const text = `${event.title} ${event.description}`.toLowerCase();
    const category = event.category;

    // Category-based classification
    if (category === EventCategory.TECH || category === EventCategory.CRYPTO) {
      sectors.add(MarketSector.TECHNOLOGY);
    }

    if (category === EventCategory.HEALTHCARE) {
      sectors.add(MarketSector.HEALTHCARE);
    }

    if (category === EventCategory.ENERGY || category === EventCategory.CLIMATE) {
      sectors.add(MarketSector.ENERGY);
    }

    if (category === EventCategory.FINANCIALS) {
      sectors.add(MarketSector.FINANCIALS);
    }

    // Keyword-based classification
    const sectorKeywords: Record<MarketSector, string[]> = {
      [MarketSector.TECHNOLOGY]: [
        'tech',
        'software',
        'ai',
        'artificial intelligence',
        'semiconductor',
        'chip',
        'apple',
        'microsoft',
        'google',
        'meta',
        'amazon',
        'nvidia',
        'tesla',
        'cloud',
        'saas',
        'cyber',
      ],
      [MarketSector.HEALTHCARE]: [
        'health',
        'healthcare',
        'pharma',
        'biotech',
        'drug',
        'fda',
        'medical',
        'hospital',
        'medicaid',
        'medicare',
        'pfizer',
        'moderna',
        'johnson',
        'clinical trial',
      ],
      [MarketSector.FINANCIALS]: [
        'bank',
        'financial',
        'insurance',
        'jpmorgan',
        'goldman',
        'wells fargo',
        'credit',
        'loan',
        'mortgage',
        'lending',
        'fintech',
        'stripe',
        'paypal',
      ],
      [MarketSector.ENERGY]: [
        'oil',
        'gas',
        'energy',
        'petroleum',
        'exxon',
        'chevron',
        'opec',
        'renewable',
        'solar',
        'wind',
        'nuclear',
        'crude',
        'wti',
        'brent',
      ],
      [MarketSector.CONSUMER_DISCRETIONARY]: [
        'retail',
        'amazon',
        'walmart',
        'consumer',
        'discretionary',
        'auto',
        'ford',
        'gm',
        'tesla',
        'nike',
        'starbucks',
        'mcdonald',
        'disney',
      ],
      [MarketSector.CONSUMER_STAPLES]: [
        'staple',
        'food',
        'beverage',
        'procter',
        'coca-cola',
        'pepsi',
        'walmart',
        'costco',
        'grocery',
      ],
      [MarketSector.INDUSTRIALS]: [
        'industrial',
        'manufacturing',
        'boeing',
        'caterpillar',
        'defense',
        'aerospace',
        'construction',
        'transport',
      ],
      [MarketSector.UTILITIES]: [
        'utility',
        'utilities',
        'electric',
        'power',
        'grid',
        'natural gas',
        'water',
      ],
      [MarketSector.REAL_ESTATE]: [
        'real estate',
        'reit',
        'property',
        'housing',
        'mortgage',
        'zillow',
        'redfin',
      ],
      [MarketSector.MATERIALS]: [
        'material',
        'mining',
        'steel',
        'aluminum',
        'copper',
        'commodity',
        'chemical',
      ],
      [MarketSector.COMMUNICATION]: [
        'telecom',
        'communication',
        'verizon',
        'at&t',
        't-mobile',
        'comcast',
        'media',
        'netflix',
      ],
    };

    // Check each sector's keywords
    for (const [sector, keywords] of Object.entries(sectorKeywords)) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        sectors.add(sector as MarketSector);
      }
    }

    // Broad economic events affect multiple sectors
    if (
      category === EventCategory.FED_POLICY ||
      category === EventCategory.RECESSION ||
      text.includes('recession') ||
      text.includes('gdp') ||
      text.includes('unemployment')
    ) {
      // Fed policy and recession affect all sectors, but especially rate-sensitive ones
      sectors.add(MarketSector.FINANCIALS);
      sectors.add(MarketSector.REAL_ESTATE);
      sectors.add(MarketSector.UTILITIES);
    }

    // Inflation affects consumer sectors
    if (text.includes('inflation') || text.includes('cpi')) {
      sectors.add(MarketSector.CONSUMER_DISCRETIONARY);
      sectors.add(MarketSector.CONSUMER_STAPLES);
    }

    return Array.from(sectors);
  }

  /**
   * Get primary sector (most relevant)
   */
  static getPrimarySector(event: PredictionMarketEvent): MarketSector | null {
    const sectors = this.classifySectors(event);

    if (sectors.length === 0) return null;

    // Priority order for primary sector
    const priority = [
      MarketSector.TECHNOLOGY,
      MarketSector.HEALTHCARE,
      MarketSector.FINANCIALS,
      MarketSector.ENERGY,
      MarketSector.CONSUMER_DISCRETIONARY,
      MarketSector.INDUSTRIALS,
      MarketSector.COMMUNICATION,
      MarketSector.CONSUMER_STAPLES,
      MarketSector.MATERIALS,
      MarketSector.UTILITIES,
      MarketSector.REAL_ESTATE,
    ];

    for (const sector of priority) {
      if (sectors.includes(sector)) {
        return sector;
      }
    }

    return sectors[0];
  }

  /**
   * Check if event affects a specific sector
   */
  static affectsSector(event: PredictionMarketEvent, sector: MarketSector): boolean {
    const sectors = this.classifySectors(event);
    return sectors.includes(sector);
  }

  /**
   * Get sector name from code
   */
  static getSectorName(sector: MarketSector): string {
    const names: Record<MarketSector, string> = {
      [MarketSector.TECHNOLOGY]: 'Technology',
      [MarketSector.HEALTHCARE]: 'Healthcare',
      [MarketSector.FINANCIALS]: 'Financials',
      [MarketSector.ENERGY]: 'Energy',
      [MarketSector.CONSUMER_DISCRETIONARY]: 'Consumer Discretionary',
      [MarketSector.CONSUMER_STAPLES]: 'Consumer Staples',
      [MarketSector.INDUSTRIALS]: 'Industrials',
      [MarketSector.UTILITIES]: 'Utilities',
      [MarketSector.REAL_ESTATE]: 'Real Estate',
      [MarketSector.MATERIALS]: 'Materials',
      [MarketSector.COMMUNICATION]: 'Communication Services',
    };

    return names[sector] || sector;
  }
}
