/**
 * Core type definitions for prediction markets
 */

export enum EventCategory {
  // Core economic/political categories
  FED_POLICY = 'fed_policy',
  ELECTION = 'election',
  ECONOMIC_DATA = 'economic_data',
  GOVERNMENT = 'government',
  GEOPOLITICAL = 'geopolitical',

  // Corporate & business categories
  CORPORATE = 'corporate',         // Earnings, M&A, IPOs, bankruptcies
  REGULATORY = 'regulatory',       // FDA approvals, antitrust, policy changes

  // Market-specific categories
  RECESSION = 'recession',         // Recession probability markets
  VOLATILITY = 'volatility',       // VIX, market volatility predictions

  // Sector-specific
  TECH = 'tech',                   // Technology sector events
  HEALTHCARE = 'healthcare',       // Healthcare/biotech sector
  ENERGY = 'energy',               // Energy sector events
  FINANCIALS = 'financials',       // Financial sector events

  // Additional categories
  CLIMATE = 'climate',             // Weather, natural disasters, climate events
  CRYPTO = 'crypto',               // Crypto/blockchain events (affects QQQ tech)
  SPORTS = 'sports',               // Sports outcomes (cultural/sentiment indicator)
}

export enum MarketSource {
  POLYMARKET = 'polymarket',
  KALSHI = 'kalshi',
  PREDICTIT = 'predictit',
  METACULUS = 'metaculus',
  MANIFOLD = 'manifold',
  CME_FEDWATCH = 'cme_fedwatch',
  FRED = 'fred',
}

export enum ImpactLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

/**
 * Market sectors (aligned with SPDR Select Sector ETFs)
 */
export enum MarketSector {
  TECHNOLOGY = 'XLK',              // Technology Select Sector
  HEALTHCARE = 'XLV',              // Health Care Select Sector
  FINANCIALS = 'XLF',              // Financial Select Sector
  ENERGY = 'XLE',                  // Energy Select Sector
  CONSUMER_DISCRETIONARY = 'XLY',  // Consumer Discretionary
  CONSUMER_STAPLES = 'XLP',        // Consumer Staples
  INDUSTRIALS = 'XLI',             // Industrial Select Sector
  UTILITIES = 'XLU',               // Utilities Select Sector
  REAL_ESTATE = 'XLRE',            // Real Estate Select Sector
  MATERIALS = 'XLB',               // Materials Select Sector
  COMMUNICATION = 'XLC',           // Communication Services
}

/**
 * Time horizons for filtering events
 */
export enum TimeHorizon {
  NEXT_7_DAYS = '7d',
  NEXT_30_DAYS = '30d',
  NEXT_90_DAYS = '90d',
  THIS_QUARTER = 'q_current',
  NEXT_QUARTER = 'q_next',
  THIS_YEAR = 'y_current',
}

/**
 * Volatility indicators
 */
export enum VolatilityLevel {
  VERY_HIGH = 'very_high',    // Probability 45-55% (maximum uncertainty)
  HIGH = 'high',              // Probability 35-65%
  MODERATE = 'moderate',      // Probability 25-75%
  LOW = 'low',                // Probability <25% or >75%
}

export interface PredictionMarketEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  closeDate: Date;
  resolutionCriteria?: string;
  tags: string[]; // e.g., ['SPY', 'QQQ', 'volatility']
  url?: string;
  sectors?: MarketSector[]; // Affected market sectors
  volatilityLevel?: VolatilityLevel; // Uncertainty indicator
}

export interface MarketOdds {
  eventId: string;
  source: MarketSource;
  probability: number; // 0-1 decimal format
  lastUpdated: Date;
  volume?: number; // Trading volume if available
  liquidity?: number; // Market liquidity if available
  metadata?: Record<string, unknown>;
}

export interface AggregatedOdds {
  eventId: string;
  event: PredictionMarketEvent;
  odds: MarketOdds[];
  aggregatedProbability: number; // Weighted/median probability
  confidence: number; // Measure of agreement between sources (0-1)
  lastUpdated: Date;
  impactScore: ImpactScore;
}

export interface ImpactScore {
  score: number; // 0-100
  level: ImpactLevel;
  factors: {
    category: number;
    proximity: number;
    uncertainty: number;
    volume: number;
  };
}

export interface FedPolicyEvent {
  meetingDate: Date;
  currentRate: { min: number; max: number };
  probabilities: {
    noChange: number;
    cut25: number;
    cut50: number;
    hike25: number;
    hike50: number;
  };
  sources: MarketSource[];
  confidence: number;
}

export interface ElectionEvent extends PredictionMarketEvent {
  candidates?: { name: string; probability: number }[];
  electionDate: Date;
}

export interface EconomicDataEvent extends PredictionMarketEvent {
  releaseDate: Date;
  indicator: string; // e.g., 'CPI', 'Jobs Report', 'GDP'
  expectedValue?: number;
  probabilities?: Record<string, number>;
}

export interface CorporateEvent extends PredictionMarketEvent {
  companyName?: string;
  ticker?: string;
  eventType: 'earnings' | 'merger' | 'acquisition' | 'ipo' | 'bankruptcy' | 'spinoff';
  expectedDate?: Date;
}

export interface RegulatoryEvent extends PredictionMarketEvent {
  agency?: string; // e.g., 'FDA', 'FTC', 'SEC', 'DOJ'
  eventType: 'approval' | 'rejection' | 'investigation' | 'ruling' | 'policy_change';
  affectedCompanies?: string[];
}

export interface RecessionEvent extends PredictionMarketEvent {
  recessionType: 'technical' | 'nber' | 'earnings';
  timeframe: string; // e.g., '2025', 'Q1 2025'
  gdpThreshold?: number;
}

export interface VolatilityEvent extends PredictionMarketEvent {
  vixLevel?: number;
  vixRange?: { min: number; max: number };
  targetDate?: Date;
}

/**
 * Advanced filtering options
 */
export interface EventFilters {
  category?: EventCategory;
  categories?: EventCategory[];
  tags?: string[];
  sectors?: MarketSector[];
  minImpactScore?: number;
  maxImpactScore?: number;
  timeHorizon?: TimeHorizon;
  volatilityLevel?: VolatilityLevel;
  limit?: number;
  offset?: number;
}

/**
 * Sector rotation signal
 */
export interface SectorRotationSignal {
  sector: MarketSector;
  momentum: number; // -1 to 1 (bearish to bullish)
  eventsCount: number;
  avgImpactScore: number;
  sentiment: 'bullish' | 'neutral' | 'bearish';
}

/**
 * Market dashboard summary
 */
export interface MarketDashboard {
  timestamp: Date;
  highImpactEvents: AggregatedOdds[];
  upcomingEvents: AggregatedOdds[];
  sectorRotation: SectorRotationSignal[];
  vixCorrelation: {
    highUncertaintyEvents: AggregatedOdds[];
    avgVolatilityLevel: number;
  };
  recessionProbability?: number;
}
