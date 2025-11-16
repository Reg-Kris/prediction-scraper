# CLAUDE.md - AI Assistant Guide for prediction-scraper

## Project Overview

**Project Name:** prediction-scraper
**Repository:** Reg-Kris/prediction-scraper
**License:** Apache License 2.0
**Primary Language:** TypeScript (anticipated)
**Framework:** Next.js (anticipated based on .gitignore patterns)

### Purpose
This project aggregates prediction market data (odds) from public APIs and available information sources for major events that may impact financial markets. The focus is on events affecting options pricing for SPY (S&P 500 ETF) and QQQ (Nasdaq-100 ETF) products.

**Target Events:**
- Presidential elections
- Government shutdowns
- Federal Reserve rate cut/hike odds
- Job openings and employment data
- Other macroeconomic events affecting equity markets

**Use Case:** Provide traders and analysts with aggregated prediction market odds to inform options trading strategies on major equity indices.

---

## Current Repository State

**Status:** Initial setup phase
**Current Branch:** `claude/claude-md-mi1sco6s3v931ig8-01M4V1fNz1XiNjVdt7DN5F3N`
**Commit History:**
- `4f34f2c` - Initial commit (includes .gitignore and LICENSE)

### Existing Files
- `.gitignore` - Configured for Next.js/Node.js projects
- `LICENSE` - Apache License 2.0
- `CLAUDE.md` - This file

---

## Anticipated Project Structure

Based on the .gitignore configuration, the following structure is expected:

```
prediction-scraper/
├── .git/                   # Git repository data
├── .gitignore             # Git ignore patterns (Next.js/Node.js)
├── LICENSE                # Apache 2.0 license
├── CLAUDE.md              # This AI assistant guide
├── README.md              # Project documentation (to be created)
├── package.json           # Node.js dependencies and scripts (to be created)
├── tsconfig.json          # TypeScript configuration (to be created)
├── next.config.js         # Next.js configuration (if using Next.js)
├── .env.example           # Environment variable template
├── src/                   # Source code directory
│   ├── app/              # Next.js app directory (if using App Router)
│   ├── pages/            # Next.js pages (if using Pages Router)
│   ├── components/       # React components
│   │   ├── markets/      # Prediction market visualizations
│   │   ├── charts/       # Odds/probability charts
│   │   └── events/       # Event-specific components
│   ├── lib/              # Utility libraries
│   ├── scrapers/         # Scraper modules for different sources
│   │   ├── polymarket/   # Polymarket API scraper
│   │   ├── kalshi/       # Kalshi API scraper
│   │   ├── predictit/    # PredictIt scraper
│   │   ├── metaculus/    # Metaculus forecasting scraper
│   │   └── fed/          # Federal Reserve data scraper
│   ├── services/         # Business logic services
│   │   ├── aggregator/   # Odds aggregation service
│   │   ├── normalizer/   # Data normalization
│   │   └── cache/        # Caching layer
│   ├── types/            # TypeScript type definitions
│   │   ├── market.ts     # Prediction market types
│   │   ├── event.ts      # Event types
│   │   └── odds.ts       # Odds/probability types
│   └── utils/            # Helper utilities
│       ├── api-client/   # API client utilities
│       ├── rate-limit/   # Rate limiting utilities
│       └── formatters/   # Data formatting helpers
├── public/               # Static assets
├── tests/                # Test files
├── docs/                 # Additional documentation
│   ├── data-sources.md   # Documentation of data sources
│   └── api.md            # API endpoint documentation
└── data/                 # Local data storage (gitignored)
    ├── cache/            # Cached API responses
    └── historical/       # Historical odds data
```

---

## Prediction Market Data Sources

### Primary Sources

**1. Polymarket** ⭐ PRIMARY
- Type: Decentralized prediction market (blockchain-based)
- API: Gamma REST API at `https://gamma-api.polymarket.com/`
- Docs: https://docs.polymarket.com/developers/gamma-markets-api/overview
- Events: Elections, economics, crypto, current events
- Data format: JSON
- Rate limits: 1,000 calls/hour (free tier), WebSocket available ($99/mo premium)
- Authentication: Optional for basic reads, API key for premium features
- Special features: GraphQL API available for blockchain data via Bitquery
- **Implementation Priority**: HIGH - Most comprehensive market data

**2. Kalshi** ⭐ PRIMARY
- Type: CFTC-regulated prediction market
- API: REST API at `https://api.elections.kalshi.com/trade-api/v2`
- Docs: https://docs.kalshi.com/
- Events: ALL markets (economics, climate, tech, entertainment, elections, Fed policy)
- Data format: JSON
- Rate limits: Subject to API terms (public endpoints available without auth)
- Authentication: API key required for trading, optional for market data
- Special features: Official CFTC regulation, high liquidity markets
- **Implementation Priority**: HIGH - Best for Fed policy and economic events

**3. Metaculus** ⭐ PRIMARY
- Type: Community forecasting platform
- API: REST API at `https://www.metaculus.com/api/`
- Docs: Official Python library at github.com/Metaculus/forecasting-tools
- Events: Long-term forecasts, geopolitical events, scientific questions
- Data format: JSON
- Rate limits: Generous (community-focused)
- Authentication: Optional for reading public forecasts
- Special features: Aggregated community predictions, high-quality forecasters
- **Implementation Priority**: MEDIUM - Best for longer-term forecasts

**4. PredictIt**
- Type: Political prediction market (CFTC-approved as of Sept 2025)
- API: Simple REST API
  - All markets: `https://www.predictit.org/api/marketdata/all/`
  - Individual: `https://www.predictit.org/api/marketdata/markets/{id}`
- Docs: https://predictit.freshdesk.com/support/solutions/articles/12000001878
- Events: Political events, elections, Supreme Court, Cabinet
- Data format: JSON
- Rate limits: Non-commercial use with attribution
- Authentication: Not required for market data
- Special features: Investment limits raised to $3,500 per contract (2025)
- **Implementation Priority**: MEDIUM - Specialized for US politics

**5. Manifold Markets**
- Type: Play-money prediction market (open source)
- API: REST API at `https://api.manifold.markets/v0/`
- Docs: https://docs.manifold.markets/api
- Events: Wide variety (politics, tech, AI, personal questions)
- Data format: JSON
- Rate limits: Very generous (community platform)
- Authentication: Not required for reads
- Special features: Fully open source, bulk data downloads available
- GitHub: github.com/manifoldmarkets/manifold
- **Implementation Priority**: LOW - Play money, good for testing

**6. Federal Reserve Economic Data (FRED)**
- Type: Official US economic data
- API: REST API at `https://api.stlouisfed.org/fred/`
- Docs: https://fred.stlouisfed.org/docs/api/
- Events: Employment, inflation, GDP, economic indicators
- Data format: JSON/XML
- Rate limits: Very generous
- Authentication: Free API key required (register at https://fred.stlouisfed.org/)
- **Implementation Priority**: HIGH - Essential for economic context

**7. CME FedWatch Tool**
- Type: Fed funds futures-based probability calculator
- URL: https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html
- Method: Web scraping OR use pyfedwatch Python package
- GitHub: https://github.com/ARahimiQuant/pyfedwatch
- Events: FOMC meeting rate decision probabilities
- Data format: HTML parsing or computed from Fed Funds futures
- Rate limits: Be respectful with scraping
- Authentication: Not required
- **Implementation Priority**: HIGH - Critical for Fed rate predictions

**8. Reddit (Sentiment Analysis)** 🆕
- Type: Social sentiment data source
- API: Reddit API via PRAW (Python Reddit API Wrapper)
- Docs: https://praw.readthedocs.io/
- Subreddits: r/wallstreetbets, r/algotrading, r/options, r/SPACs
- Data format: JSON
- Rate limits: 60 requests per minute (OAuth)
- Authentication: Reddit API credentials required
- Special features: Real-time sentiment, retail trader positioning
- **Implementation Priority**: LOW - Supplementary data

### Data Aggregation Strategy

1. **Fetch** odds from multiple sources for same event
2. **Normalize** different probability formats (decimal, fractional, implied probability)
3. **Aggregate** using weighted average or median
4. **Store** historical data for trend analysis
5. **Display** with source attribution and confidence intervals

---

## System Architecture & Implementation Plan

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                   SINGLE PAGE DASHBOARD (Next.js)               │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │  Fed Policy   │  │  Elections    │  │  Economic     │      │
│  │  Tracker      │  │  Odds         │  │  Events       │      │
│  │  (CME/Kalshi) │  │(Polymarket/PI)│  │  (FRED)       │      │
│  └───────────────┘  └───────────────┘  └───────────────┘      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │     Aggregated Market Impact Analysis                   │  │
│  │     SPY/QQQ Volatility • Event Timeline • Confidence    │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │     Real-time Charts (Recharts/Tremor)                  │  │
│  │     7-day trends • 30-day history • Source comparison   │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              CLIENT-SIDE STATE (TanStack Query)                 │
│  • 5-min cache for recent events    • Auto-refetch             │
│  • 15-min cache for distant events  • Optimistic updates       │
│  • Stale-while-revalidate pattern   • Error boundaries         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTES                           │
│  /api/markets/fed-policy    /api/markets/elections              │
│  /api/markets/economic      /api/markets/aggregate              │
│  /api/events/[id]           /api/health                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│               SERVER-SIDE SERVICES LAYER                        │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │ Aggregation Svc  │  │  Normalization   │                   │
│  │ • Weighted avg   │  │  • Format convert│                   │
│  │ • Median calc    │  │  • Probability   │                   │
│  │ • Confidence     │  │  • Timestamp sync│                   │
│  └──────────────────┘  └──────────────────┘                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           In-Memory Cache (Node.js Map)                  │  │
│  │           TTL: 5min (recent) / 15min (distant)           │  │
│  │           Optional: Redis for production scaling         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     SCRAPER SERVICES                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │Polymarket│ │  Kalshi  │ │Metaculus │ │PredictIt │         │
│  │  Gamma   │ │   REST   │ │   REST   │ │   REST   │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│  │ Manifold │ │   FRED   │ │CME Watch │                       │
│  │   REST   │ │   REST   │ │  Scraper │                       │
│  └──────────┘ └──────────┘ └──────────┘                       │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │            Rate Limiter (per-source config)             │  │
│  │  Polymarket: 10 req/s  |  Kalshi: 5 req/s               │  │
│  │  PredictIt: 2 req/s    |  Others: 10 req/s              │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- **Next.js 14** with App Router (`/app` directory)
- **React 18** with Server Components where appropriate
- **TailwindCSS** for styling
- **Tremor** or **Recharts** for financial charts and dashboards
- **TanStack Query** (React Query) for data fetching and caching
- **Zod** for runtime type validation
- **date-fns** for date handling

**Backend:**
- **Next.js API Routes** (`/app/api`)
- **Axios** for HTTP requests
- **Cheerio** for HTML scraping (CME FedWatch)
- **Node.js** in-memory cache (production: Redis optional)

**Type Safety:**
- **TypeScript** with strict mode
- **Zod** schemas for API response validation
- Type-safe API route handlers

**Development:**
- **ESLint** + **Prettier** for code quality
- **Jest** for unit tests
- **Playwright** for E2E tests (optional)

### Implementation Phases

**Phase 1: Core Infrastructure** (Current Sprint)
- ✅ Research APIs and data sources
- 🔄 Initialize Next.js project with TypeScript
- 🔄 Set up directory structure
- 🔄 Create base types and interfaces
- 🔄 Build single-page dashboard shell
- 🔄 Implement basic API route structure

**Phase 2: Data Layer** (Next Sprint)
- Implement scraper classes for each source:
  - Polymarket scraper
  - Kalshi scraper
  - PredictIt scraper
  - CME FedWatch scraper (highest priority)
  - FRED scraper
- Create rate limiter utility
- Build normalization service
- Implement aggregation algorithms

**Phase 3: Dashboard & Visualization** (Sprint 3)
- Create dashboard components:
  - Fed Policy widget (CME + Kalshi)
  - Elections widget (Polymarket + PredictIt)
  - Economic Events widget (FRED + Kalshi)
  - Aggregated impact analysis
- Build real-time charts
- Implement auto-refresh logic
- Add loading states and error handling

**Phase 4: Polish & Production** (Sprint 4)
- Add historical data tracking
- Implement Redis caching (optional)
- Performance optimization
- Error monitoring (Sentry optional)
- Documentation
- Deployment (Vercel recommended)

### Dashboard Layout Design

**Single Page Structure:**

```
┌──────────────────────────────────────────────────────────┐
│  📊 Prediction Market Aggregator for SPY/QQQ Trading     │
│  Last Updated: 2 minutes ago  •  Auto-refresh: ON        │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │  🏛️ Federal Reserve Policy (Next FOMC: Dec 18)     │ │
│  │  Current Rate: 4.50-4.75%                          │ │
│  │                                                     │ │
│  │  Next Meeting Probabilities:                       │ │
│  │  ┌──────────────────────────────────────────┐     │ │
│  │  │ No Change: 65% ████████████████▌         │     │ │
│  │  │ -25 bps:   30% ███████▌                  │     │ │
│  │  │ -50 bps:    5% █▌                        │     │ │
│  │  └──────────────────────────────────────────┘     │ │
│  │  Sources: CME FedWatch, Kalshi, Polymarket         │ │
│  │  Confidence: 85% ✓  [7-day trend chart →]          │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌───────────────────┐  ┌───────────────────────────┐  │
│  │ 🗳️ Elections       │  │ 📈 Economic Events        │  │
│  │                   │  │                           │  │
│  │ 2024 Presidential │  │ Next Jobs Report: Dec 6   │  │
│  │ Market Closed ✓   │  │ Expected: 150K jobs       │  │
│  │                   │  │ >200K: 35%                │  │
│  │ 2026 Midterms     │  │ <100K: 20%                │  │
│  │ House Control:    │  │                           │  │
│  │ GOP: 58%          │  │ CPI (Dec 11): >3%: 65%    │  │
│  │ DEM: 42%          │  │                           │  │
│  └───────────────────┘  └───────────────────────────┘  │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │  📊 Aggregated Market Impact for SPY/QQQ           │ │
│  │                                                     │ │
│  │  High Impact Events (Next 30 Days):                │ │
│  │  • Dec 6  - Jobs Report        Impact: ⚠️ HIGH    │ │
│  │  • Dec 11 - CPI Release        Impact: ⚠️ HIGH    │ │
│  │  • Dec 18 - FOMC Meeting       Impact: 🔴 CRITICAL│ │
│  │                                                     │ │
│  │  [30-day volatility forecast chart]                │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │  📉 Historical Odds Trends                          │ │
│  │  [Interactive line chart showing probability       │ │
│  │   evolution for selected events across sources]    │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Key Features

1. **Real-time Aggregation**: Combine odds from multiple sources with confidence intervals
2. **SPY/QQQ Impact Scoring**: Automatically score events by likely market impact
3. **Source Attribution**: Always show which markets contributed to aggregate odds
4. **Auto-refresh**: Smart refresh rates based on event proximity
5. **Historical Charts**: 7-day and 30-day trend visualization
6. **Error Handling**: Graceful degradation if sources unavailable
7. **Mobile Responsive**: Works on all devices

### SPY/QQQ Impact Scoring Algorithm

```typescript
// Pseudo-code for impact scoring
function calculateMarketImpact(event: PredictionMarketEvent): ImpactScore {
  let score = 0;

  // Base score by category
  if (event.category === 'FED_POLICY') score = 90;
  else if (event.category === 'ECONOMIC_DATA') score = 75;
  else if (event.category === 'ELECTION') score = 60;
  else if (event.category === 'GOVERNMENT') score = 40;

  // Boost for proximity
  const daysUntil = getDaysUntil(event.closeDate);
  if (daysUntil <= 7) score *= 1.3;
  else if (daysUntil <= 30) score *= 1.1;

  // Boost for high uncertainty (high volatility indicator)
  const uncertainty = calculateUncertainty(event.odds);
  if (uncertainty > 0.4) score *= 1.2;

  // Boost for high volume/liquidity
  const avgVolume = event.odds.reduce((sum, o) => sum + (o.volume || 0), 0) / event.odds.length;
  if (avgVolume > 1000000) score *= 1.1;

  return {
    score: Math.min(100, Math.round(score)),
    level: score > 80 ? 'CRITICAL' : score > 60 ? 'HIGH' : score > 40 ? 'MEDIUM' : 'LOW'
  };
}
```

### Environment Variables Setup

```env
# Prediction Market API Keys
POLYMARKET_API_KEY=           # Optional for basic access
KALSHI_API_KEY=               # Required for Kalshi
KALSHI_API_SECRET=            # Required for Kalshi
FRED_API_KEY=                 # Free from fred.stlouisfed.org
REDDIT_CLIENT_ID=             # Optional - for sentiment
REDDIT_CLIENT_SECRET=         # Optional - for sentiment

# Rate Limiting Configuration
RATE_LIMIT_POLYMARKET=10      # requests per second
RATE_LIMIT_KALSHI=5
RATE_LIMIT_PREDICTIT=2
RATE_LIMIT_METACULUS=10

# Caching Configuration
CACHE_TTL_RECENT_EVENTS=300   # 5 minutes (seconds)
CACHE_TTL_DISTANT_EVENTS=900  # 15 minutes (seconds)
REDIS_URL=                    # Optional: redis://localhost:6379

# Feature Flags
ENABLE_HISTORICAL_DATA=true
ENABLE_AUTO_REFRESH=true
ENABLE_REDDIT_SENTIMENT=false

# Categories to Track
TRACK_FED_POLICY=true
TRACK_ELECTIONS=true
TRACK_ECONOMIC_DATA=true
TRACK_GOVERNMENT=true
```

### Initial Scrapers Priority

**Must Implement First (MVP):**
1. ✅ CME FedWatch scraper (Fed policy - CRITICAL for SPY/QQQ)
2. ✅ Kalshi scraper (Fed + economics)
3. ✅ Polymarket scraper (broad coverage)
4. ✅ PredictIt scraper (politics)

**Phase 2:**
5. FRED scraper (economic data context)
6. Metaculus scraper (long-term forecasts)

**Phase 3 (Optional):**
7. Manifold Markets (testing/validation)
8. Reddit sentiment (supplementary)

---

## Development Guidelines for AI Assistants

### 1. Code Quality Standards

#### TypeScript
- **Always use TypeScript** for type safety
- Define interfaces and types in `src/types/` directory
- Use strict mode in tsconfig.json
- Avoid `any` types; prefer `unknown` when type is uncertain
- Export types alongside implementation

#### Code Style
- Use ESLint and Prettier for consistent formatting
- Prefer functional components and hooks for React
- Use async/await over promises for readability
- Write self-documenting code with clear variable names
- Add JSDoc comments for complex functions

#### Example TypeScript Pattern
```typescript
// src/types/market.ts
export enum EventCategory {
  ELECTION = 'election',
  FED_POLICY = 'fed_policy',
  ECONOMIC_DATA = 'economic_data',
  GOVERNMENT = 'government',
  GEOPOLITICAL = 'geopolitical'
}

export enum MarketSource {
  POLYMARKET = 'polymarket',
  KALSHI = 'kalshi',
  PREDICTIT = 'predictit',
  METACULUS = 'metaculus',
  CME_FEDWATCH = 'cme_fedwatch'
}

export interface PredictionMarketEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  closeDate: Date;
  resolutionCriteria: string;
  tags: string[]; // e.g., ['SPY', 'QQQ', 'volatility']
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
  confidence: number; // Measure of agreement between sources
  lastUpdated: Date;
}

// src/scrapers/baseScraper.ts
export abstract class BasePredictionScraper {
  protected readonly source: MarketSource;

  constructor(source: MarketSource) {
    this.source = source;
  }

  abstract fetchEvents(category?: EventCategory): Promise<PredictionMarketEvent[]>;
  abstract fetchOdds(eventId: string): Promise<MarketOdds>;
  abstract search(query: string): Promise<PredictionMarketEvent[]>;
}
```

### 2. Security Best Practices

#### Environment Variables
- **Never commit** `.env` files or secrets
- Use `.env.example` to document required variables
- Access via `process.env.VARIABLE_NAME`
- Validate environment variables at startup

#### Web Scraping Ethics
- Respect robots.txt files
- Implement rate limiting to avoid overwhelming servers
- Add appropriate User-Agent headers
- Include timeout mechanisms
- Handle errors gracefully without exposing sensitive info

#### Input Validation
- Sanitize all external input
- Validate URLs before scraping
- Use libraries like `zod` for runtime type validation
- Prevent XSS, SQL injection, and command injection

### 3. Error Handling

```typescript
// Good error handling pattern
try {
  const data = await scraper.fetch(url);
  return processData(data);
} catch (error) {
  if (error instanceof NetworkError) {
    logger.error('Network error:', error.message);
    // Implement retry logic
  } else if (error instanceof ParseError) {
    logger.error('Parse error:', error.message);
    // Log and skip invalid data
  } else {
    logger.error('Unexpected error:', error);
    throw error; // Re-throw unexpected errors
  }
}
```

### 4. Testing Requirements

- Write unit tests for scrapers and utilities
- Use Jest or Vitest as test runner
- Mock external HTTP requests in tests
- Aim for >80% code coverage for critical paths
- Test error conditions and edge cases

### 5. Git Workflow

#### Branch Naming
- Feature branches: `feature/description`
- Bug fixes: `fix/description`
- Claude AI branches: `claude/claude-md-[session-id]`

#### Commit Messages
Follow conventional commits format:
```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

Example:
```
feat(scraper): add rate limiting to prediction scraper

Implements exponential backoff for failed requests
Adds configurable rate limit via environment variables

Closes #123
```

#### Pull Request Process
1. Create feature branch from main
2. Implement changes with tests
3. Ensure all tests pass
4. Update documentation
5. Create PR with descriptive title and body
6. Push to branch: `git push -u origin <branch-name>`

**Important:** When pushing, branch names must start with 'claude/' and end with matching session ID, otherwise push will fail with 403 error.

### 6. Scraper Implementation Pattern

```typescript
// Example: Polymarket scraper
import { BasePredictionScraper } from './baseScraper';
import { PredictionMarketEvent, MarketOdds, MarketSource, EventCategory } from '../types/market';
import { RateLimiter } from '../utils/rate-limit';
import axios, { AxiosInstance } from 'axios';

export class PolymarketScraper extends BasePredictionScraper {
  private readonly client: AxiosInstance;
  private readonly rateLimiter: RateLimiter;
  private readonly baseUrl = 'https://api.polymarket.com/v1';

  constructor(apiKey?: string) {
    super(MarketSource.POLYMARKET);

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {},
      timeout: 30000
    });

    // 10 requests per second max
    this.rateLimiter = new RateLimiter(10, 1000);
  }

  async fetchEvents(category?: EventCategory): Promise<PredictionMarketEvent[]> {
    await this.rateLimiter.wait();

    try {
      const response = await this.client.get('/markets', {
        params: {
          active: true,
          tag: this.mapCategoryToTag(category)
        }
      });

      return response.data.map(this.transformToEvent);
    } catch (error) {
      this.handleError('fetchEvents', error);
      throw error;
    }
  }

  async fetchOdds(eventId: string): Promise<MarketOdds> {
    await this.rateLimiter.wait();

    try {
      const response = await this.client.get(`/markets/${eventId}`);
      return this.transformToOdds(eventId, response.data);
    } catch (error) {
      this.handleError('fetchOdds', error);
      throw error;
    }
  }

  async search(query: string): Promise<PredictionMarketEvent[]> {
    await this.rateLimiter.wait();

    const response = await this.client.get('/markets/search', {
      params: { query }
    });

    return response.data.map(this.transformToEvent);
  }

  private transformToEvent(raw: any): PredictionMarketEvent {
    return {
      id: `polymarket-${raw.id}`,
      title: raw.question,
      description: raw.description,
      category: this.categorizeEvent(raw),
      closeDate: new Date(raw.end_date),
      resolutionCriteria: raw.rules,
      tags: this.extractTags(raw)
    };
  }

  private transformToOdds(eventId: string, raw: any): MarketOdds {
    return {
      eventId,
      source: this.source,
      probability: raw.outcome_prices?.[0] || 0, // Already in 0-1 format
      lastUpdated: new Date(),
      volume: raw.volume_24h,
      liquidity: raw.liquidity,
      metadata: {
        volumeUSD: raw.volume_usd,
        liquidityUSD: raw.liquidity_usd
      }
    };
  }

  private categorizeEvent(raw: any): EventCategory {
    // Logic to categorize based on tags, description, etc.
    const tags = raw.tags?.map((t: string) => t.toLowerCase()) || [];

    if (tags.includes('elections') || tags.includes('politics')) {
      return EventCategory.ELECTION;
    }
    if (tags.includes('fed') || tags.includes('rates')) {
      return EventCategory.FED_POLICY;
    }
    if (tags.includes('jobs') || tags.includes('economy')) {
      return EventCategory.ECONOMIC_DATA;
    }

    return EventCategory.GEOPOLITICAL;
  }

  private extractTags(raw: any): string[] {
    const tags = [...(raw.tags || [])];

    // Add SPY/QQQ tags if event is likely to impact these
    if (this.impactsSPY(raw)) tags.push('SPY');
    if (this.impactsQQQ(raw)) tags.push('QQQ');

    return tags;
  }

  private impactsSPY(raw: any): boolean {
    // Logic to determine if event impacts S&P 500
    const impactKeywords = ['election', 'fed', 'shutdown', 'recession', 'crisis'];
    const text = `${raw.question} ${raw.description}`.toLowerCase();
    return impactKeywords.some(keyword => text.includes(keyword));
  }

  private impactsQQQ(raw: any): boolean {
    // Logic to determine if event impacts Nasdaq-100
    const impactKeywords = ['tech', 'regulation', 'ai', 'election', 'fed'];
    const text = `${raw.question} ${raw.description}`.toLowerCase();
    return impactKeywords.some(keyword => text.includes(keyword));
  }

  private mapCategoryToTag(category?: EventCategory): string | undefined {
    if (!category) return undefined;

    const mapping: Record<EventCategory, string> = {
      [EventCategory.ELECTION]: 'elections',
      [EventCategory.FED_POLICY]: 'fed',
      [EventCategory.ECONOMIC_DATA]: 'economy',
      [EventCategory.GOVERNMENT]: 'government',
      [EventCategory.GEOPOLITICAL]: 'geopolitics'
    };

    return mapping[category];
  }

  private handleError(method: string, error: unknown): void {
    console.error(`PolymarketScraper.${method} error:`, error);
    // Add proper logging here
  }
}
```

**Key Implementation Points:**
1. **Rate Limiting**: Always implement rate limiting to respect API limits
2. **Error Handling**: Catch and log errors appropriately
3. **Transformation**: Convert source-specific data to standardized format
4. **Categorization**: Intelligently categorize events for filtering
5. **Impact Analysis**: Identify which events affect SPY/QQQ
6. **Metadata**: Preserve source-specific data in metadata field

### 7. Financial Market Context

#### SPY (S&P 500 ETF) and QQQ (Nasdaq-100 ETF)

**Understanding the Connection:**
- Options traders use prediction market odds to assess tail risk
- Major events can cause volatility spikes affecting option premiums
- Prediction markets can lead traditional indicators by hours/days
- Useful for positioning before FOMC meetings, elections, economic data releases

**Events with High SPY/QQQ Impact:**
1. **Federal Reserve Decisions**
   - Rate hikes/cuts directly affect equity valuations
   - CME FedWatch tool provides market-implied probabilities
   - Track via Fed futures, Kalshi, Polymarket

2. **Elections**
   - Presidential and congressional elections affect policy expectations
   - Sector rotation based on likely winners
   - Track via PredictIt, Polymarket, Metaculus

3. **Economic Data**
   - Jobs reports, CPI, GDP
   - Surprises cause immediate market reactions
   - Track forecasts vs. prediction market expectations

4. **Government Shutdowns**
   - Short-term market disruption
   - Credit rating implications
   - Track via prediction markets

5. **Geopolitical Events**
   - Wars, trade disputes, sanctions
   - Safe-haven flows, sector impacts
   - Track via various prediction platforms

**Options Trading Applications:**
- **VIX positioning**: High uncertainty events → long volatility
- **Directional trades**: Clear probability asymmetries
- **Event spreads**: Straddles/strangles before major events
- **Calendar spreads**: Time decay around known event dates

### 8. Performance Considerations

- **Cache API responses** with appropriate TTLs (e.g., 5-15 minutes for odds)
- **Implement concurrent scraping** with controlled parallelism
- **Use streams** for large datasets
- **Monitor memory usage** when storing historical data
- **Implement pagination** for large result sets
- **Database indexing** on eventId, category, closeDate for fast queries
- **WebSocket connections** for real-time odds updates where available

### 9. Logging and Monitoring

```typescript
// Use structured logging
import { logger } from './utils/logger';

logger.info('Scraping started', {
  source: 'example.com',
  timestamp: new Date()
});

logger.error('Scraping failed', {
  source: 'example.com',
  error: error.message,
  stack: error.stack
});
```

### 10. Prediction Market Data Best Practices

#### Probability Normalization
Different sources use different formats for probabilities:
- **Decimal**: 0.0 to 1.0 (Polymarket, Metaculus)
- **Percentage**: 0 to 100 (PredictIt)
- **Fractional**: e.g., "3/1" (some traditional bookmakers)
- **American Odds**: e.g., "+150", "-200" (sports betting)

**Always normalize to decimal 0-1 format internally:**

```typescript
export class OddsNormalizer {
  static toDecimal(value: number | string, format: OddsFormat): number {
    switch (format) {
      case 'decimal':
        return typeof value === 'number' ? value : parseFloat(value);
      case 'percentage':
        return (typeof value === 'number' ? value : parseFloat(value)) / 100;
      case 'fractional':
        // Parse "3/1" to 0.25
        const [num, den] = String(value).split('/').map(Number);
        return den / (num + den);
      case 'american':
        return this.americanToDecimal(Number(value));
      default:
        throw new Error(`Unknown odds format: ${format}`);
    }
  }

  private static americanToDecimal(odds: number): number {
    if (odds > 0) {
      return 100 / (odds + 100);
    } else {
      return Math.abs(odds) / (Math.abs(odds) + 100);
    }
  }
}
```

#### Aggregation Methods
When combining odds from multiple sources:

```typescript
export class OddsAggregator {
  // Simple average (use when sources equally reliable)
  static average(odds: MarketOdds[]): number {
    const sum = odds.reduce((acc, o) => acc + o.probability, 0);
    return sum / odds.length;
  }

  // Weighted average (weight by volume/liquidity)
  static weightedAverage(odds: MarketOdds[]): number {
    const totalVolume = odds.reduce((acc, o) => acc + (o.volume || 0), 0);
    if (totalVolume === 0) return this.average(odds);

    const weighted = odds.reduce((acc, o) => {
      const weight = (o.volume || 0) / totalVolume;
      return acc + (o.probability * weight);
    }, 0);

    return weighted;
  }

  // Median (robust to outliers)
  static median(odds: MarketOdds[]): number {
    const sorted = [...odds].sort((a, b) => a.probability - b.probability);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1].probability + sorted[mid].probability) / 2;
    }
    return sorted[mid].probability;
  }

  // Calculate confidence (measure of agreement)
  static calculateConfidence(odds: MarketOdds[]): number {
    if (odds.length < 2) return 1.0;

    const avg = this.average(odds);
    const variance = odds.reduce((acc, o) => {
      return acc + Math.pow(o.probability - avg, 2);
    }, 0) / odds.length;

    const stdDev = Math.sqrt(variance);

    // High confidence when standard deviation is low
    // Return value between 0 and 1
    return Math.max(0, 1 - (stdDev * 2));
  }
}
```

#### Data Freshness
- Track `lastUpdated` timestamp for every data point
- Display age of data to users (e.g., "5 minutes ago")
- Implement staleness checks before using cached data
- Set appropriate cache TTLs based on event proximity:
  - Events >30 days away: 1 hour cache
  - Events 7-30 days away: 15 minutes cache
  - Events <7 days away: 5 minutes cache
  - Events <24 hours away: 1 minute cache or real-time

#### Error Handling for Market Data
```typescript
export class MarketDataError extends Error {
  constructor(
    public source: MarketSource,
    public eventId: string,
    message: string,
    public isRetryable: boolean = true
  ) {
    super(`[${source}] ${message}`);
    this.name = 'MarketDataError';
  }
}

// Usage in scrapers
try {
  const odds = await scraper.fetchOdds(eventId);
  return odds;
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 429) {
      throw new MarketDataError(
        this.source,
        eventId,
        'Rate limit exceeded',
        true
      );
    } else if (error.response?.status === 404) {
      throw new MarketDataError(
        this.source,
        eventId,
        'Event not found',
        false
      );
    }
  }
  throw error;
}
```

### 11. Documentation Requirements

When creating or modifying code:

1. **Update README.md** with:
   - Setup instructions
   - Usage examples
   - API documentation
   - Environment variables
   - Data source attribution

2. **Add inline comments** for:
   - Complex algorithms (especially aggregation logic)
   - Business logic decisions
   - Non-obvious code patterns
   - Financial calculations

3. **Create JSDoc** for:
   - Public APIs
   - Class constructors
   - Exported functions
   - Data transformation functions

4. **Update CLAUDE.md** when:
   - Adding new data sources
   - Adding new patterns or conventions
   - Changing project structure
   - Introducing new tools or frameworks

5. **Document data sources** in `docs/data-sources.md`:
   - API endpoints used
   - Authentication requirements
   - Rate limits
   - Data format
   - Update frequency
   - Attribution requirements

---

## Dependencies Management

### Recommended Core Dependencies

```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "react-dom": "^18.x",

    "axios": "^1.x",
    "cheerio": "^1.x",
    "zod": "^3.x",

    "date-fns": "^3.x",
    "decimal.js": "^10.x",

    "@tanstack/react-query": "^5.x",
    "recharts": "^2.x",
    "tailwindcss": "^3.x",

    "ioredis": "^5.x",
    "pg": "^8.x",
    "prisma": "^5.x",
    "@prisma/client": "^5.x",

    "winston": "^3.x",
    "pino": "^8.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/node": "^20.x",
    "@types/react": "^18.x",
    "@types/pg": "^8.x",

    "eslint": "^8.x",
    "eslint-config-next": "^14.x",
    "prettier": "^3.x",

    "jest": "^29.x",
    "ts-jest": "^29.x",
    "@testing-library/react": "^14.x",
    "@testing-library/jest-dom": "^6.x",

    "nock": "^13.x",
    "msw": "^2.x",

    "@types/jest": "^29.x"
  }
}
```

**Key Dependencies Explained:**

**Data Fetching & Scraping:**
- `axios`: HTTP client for API calls
- `cheerio`: HTML parsing for web scraping (CME FedWatch, etc.)
- `zod`: Runtime type validation for API responses

**Financial Data:**
- `date-fns`: Date manipulation for expiration dates, market hours
- `decimal.js`: Precise decimal arithmetic for odds/probabilities

**Frontend:**
- `@tanstack/react-query`: Data fetching, caching, synchronization
- `recharts`: Charts for odds visualization
- `tailwindcss`: Styling

**Database & Caching:**
- `ioredis`: Redis client for caching
- `pg`: PostgreSQL client
- `prisma`: Type-safe database ORM

**Logging:**
- `winston` or `pino`: Structured logging

**Testing:**
- `jest`: Test framework
- `nock` / `msw`: Mock HTTP requests in tests

### Adding Dependencies
- Use `npm install` or `yarn add`
- Document why major dependencies are added
- Prefer well-maintained packages
- Check for security vulnerabilities regularly
- Keep dependencies up to date

---

## Environment Configuration

### Required Environment Variables

Create `.env.example` with template:

```env
# Application
NODE_ENV=development
PORT=3000
APP_NAME=prediction-scraper

# Prediction Market API Keys
POLYMARKET_API_KEY=
KALSHI_API_KEY=
KALSHI_API_SECRET=
PREDICTIT_EMAIL=
PREDICTIT_PASSWORD=
METACULUS_API_TOKEN=
FRED_API_KEY=  # Free from https://fred.stlouisfed.org/docs/api/api_key.html

# Scraper Configuration
SCRAPER_RATE_LIMIT_POLYMARKET=10  # requests per second
SCRAPER_RATE_LIMIT_KALSHI=5
SCRAPER_RATE_LIMIT_PREDICTIT=2
SCRAPER_RATE_LIMIT_METACULUS=10
SCRAPER_TIMEOUT=30000  # milliseconds
SCRAPER_USER_AGENT=prediction-scraper/1.0
SCRAPER_RETRY_ATTEMPTS=3
SCRAPER_RETRY_DELAY=2000  # milliseconds

# Cache Configuration
CACHE_TTL_ODDS=300  # 5 minutes in seconds
CACHE_TTL_EVENTS=3600  # 1 hour in seconds
REDIS_URL=redis://localhost:6379  # Optional: for distributed caching

# Database (if using persistent storage)
DATABASE_URL=postgresql://user:password@localhost:5432/prediction_markets
DATABASE_POOL_SIZE=10

# Feature Flags
ENABLE_WEBSOCKETS=false
ENABLE_HISTORICAL_DATA=true
ENABLE_REAL_TIME_UPDATES=false

# Market Focus
TRACK_SPY=true
TRACK_QQQ=true
TRACK_VIX=true

# Event Categories to Track (comma-separated)
TRACKED_CATEGORIES=fed_policy,election,economic_data,government

# Logging
LOG_LEVEL=info  # debug, info, warn, error
LOG_FORMAT=json  # json or pretty

# Monitoring (optional)
SENTRY_DSN=
DATADOG_API_KEY=

# Frontend (if building UI)
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_ENABLE_CHARTS=true
```

**Required API Keys:**
1. **FRED_API_KEY**: Free from Federal Reserve (essential for economic data)
2. **POLYMARKET_API_KEY**: Optional, some data available without auth
3. **KALSHI_API_KEY**: Required for Kalshi markets
4. **Others**: Optional based on data sources you want to use

---

## Common Tasks for AI Assistants

### Starting a New Feature
1. Understand the requirement clearly
2. Check existing code for similar patterns
3. Create appropriate directory structure
4. Implement with tests
5. Update documentation
6. Commit with conventional commit message

### Debugging Issues
1. Check logs for error messages
2. Verify environment variables
3. Review recent changes in git history
4. Test in isolation
5. Add additional logging if needed
6. Fix and add regression test

### Refactoring Code
1. Ensure tests exist and pass
2. Make incremental changes
3. Run tests after each change
4. Update documentation
5. Verify no functionality is broken

### Adding a New Scraper
1. Create file in `src/scrapers/`
2. Extend `BaseScraper` class
3. Implement required methods
4. Add configuration options
5. Write unit tests
6. Document scraper purpose and usage
7. Add to scraper registry

---

## AI Assistant Behavioral Guidelines

### Communication
- Be concise and clear
- Explain complex decisions
- Ask for clarification when requirements are ambiguous
- Provide code examples when helpful

### Code Changes
- Make focused, single-purpose changes
- Preserve existing functionality unless explicitly changing it
- Follow established patterns in the codebase
- Write self-documenting code

### Problem Solving
1. Understand the problem thoroughly
2. Research existing solutions in codebase
3. Propose approach before implementing
4. Implement with tests
5. Verify solution works as expected

### When Uncertain
- Ask questions rather than making assumptions
- Research in documentation or codebase
- Propose multiple approaches if applicable
- Defer to human judgment on architectural decisions

---

## Project-Specific Conventions

### File Naming
- Use kebab-case for files: `prediction-scraper.ts`
- Use PascalCase for components: `PredictionList.tsx`
- Use camelCase for utilities: `formatPrediction.ts`
- Suffix test files with `.test.ts` or `.spec.ts`

### Import Organization
```typescript
// 1. External dependencies
import React from 'react';
import axios from 'axios';

// 2. Internal absolute imports
import { Prediction } from '@/types/prediction';
import { logger } from '@/utils/logger';

// 3. Relative imports
import { ScraperConfig } from './types';
import styles from './scraper.module.css';
```

### Constants
- Define in UPPER_SNAKE_CASE
- Group related constants in dedicated files
- Export from `src/constants/` directory

---

## Useful Commands (to be confirmed when package.json exists)

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report

# Linting
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format with Prettier

# Type checking
npm run type-check   # Run TypeScript compiler check
```

---

## Troubleshooting

### Common Issues

**TypeScript Errors**
- Run `npm run type-check` to see all errors
- Check `tsconfig.json` for correct configuration
- Ensure all dependencies have type definitions

**Scraping Failures**
- Verify URL is accessible
- Check rate limiting configuration
- Review robots.txt compliance
- Inspect network logs

**Build Failures**
- Clear `.next` directory: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check for TypeScript errors
- Verify environment variables

---

## Resources

### Documentation Links (to be added)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Cheerio Documentation](https://cheerio.js.org/)

### Related Projects
- TBD

---

## Changelog

### 2025-11-16 - v1.0.0 (Initial Version)
- **Project Purpose**: Documented project goals for aggregating prediction market data
  - Focus on SPY/QQQ impact events
  - Target events: elections, Fed policy, economic data, government actions
- **Data Sources**: Identified 6 primary sources
  - Polymarket, Kalshi, PredictIt, Metaculus, FRED, CME FedWatch
- **Project Structure**: Defined anticipated directory structure
  - Scraper organization by source
  - Type definitions for markets, events, and odds
  - Services for aggregation and normalization
- **Development Guidelines**: Established comprehensive coding standards
  - TypeScript patterns for prediction market data
  - Security best practices for API credentials
  - Error handling patterns
  - Testing requirements
- **Financial Context**: Documented SPY/QQQ trading applications
  - Options trading use cases
  - Event impact analysis
  - Volatility considerations
- **Implementation Patterns**: Provided detailed examples
  - Base scraper class pattern
  - Polymarket scraper implementation
  - Rate limiting utilities
  - Data normalization methods
  - Aggregation algorithms
- **Environment Configuration**: Defined required environment variables
  - API keys for each source
  - Rate limiting configuration
  - Cache TTL settings
  - Feature flags
- **Dependencies**: Specified recommended packages
  - Core dependencies for data fetching and processing
  - Frontend libraries for visualization
  - Database and caching infrastructure
  - Testing and logging tools

---

## Contact & Contribution

**Repository Owner:** Reg-Kris
**License:** Apache License 2.0

For AI assistants working on this project: Always prioritize code quality, security, and maintainability. When in doubt, ask for clarification rather than making assumptions.

---

**Last Updated:** 2025-11-16
**Document Version:** 1.0.0
