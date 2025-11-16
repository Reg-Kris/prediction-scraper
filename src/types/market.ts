/**
 * Core type definitions for prediction markets
 */

export enum EventCategory {
  FED_POLICY = 'fed_policy',
  ELECTION = 'election',
  ECONOMIC_DATA = 'economic_data',
  GOVERNMENT = 'government',
  GEOPOLITICAL = 'geopolitical',
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

export interface PredictionMarketEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  closeDate: Date;
  resolutionCriteria?: string;
  tags: string[]; // e.g., ['SPY', 'QQQ', 'volatility']
  url?: string;
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
