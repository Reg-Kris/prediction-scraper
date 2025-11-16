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

**1. Polymarket**
- Type: Decentralized prediction market (blockchain-based)
- API: Public API available
- Events: Elections, economics, current events
- Data format: JSON
- Rate limits: To be determined
- Authentication: API key may be required

**2. Kalshi**
- Type: CFTC-regulated prediction market
- API: REST API available
- Events: Economic data, Fed policy, elections
- Data format: JSON
- Rate limits: Subject to API terms
- Authentication: API key required

**3. PredictIt**
- Type: Academic prediction market
- API: Public API with limitations
- Events: Political events, elections
- Data format: JSON
- Rate limits: Conservative (respect ToS)
- Authentication: May require registration

**4. Metaculus**
- Type: Forecasting platform
- API: Public API available
- Events: Long-term forecasts, current events
- Data format: JSON
- Rate limits: To be determined
- Authentication: May be optional for reading

**5. Federal Reserve Economic Data (FRED)**
- Type: Official economic data
- API: FRED API
- Events: Employment, inflation, economic indicators
- Data format: JSON/XML
- Rate limits: Generous
- Authentication: Free API key required

**6. CME FedWatch Tool**
- Type: Fed funds futures-based probability tool
- Method: Web scraping (no official API)
- Events: FOMC meeting rate decision probabilities
- Data format: HTML parsing
- Rate limits: Be respectful
- Authentication: Not required

### Data Aggregation Strategy

1. **Fetch** odds from multiple sources for same event
2. **Normalize** different probability formats (decimal, fractional, implied probability)
3. **Aggregate** using weighted average or median
4. **Store** historical data for trend analysis
5. **Display** with source attribution and confidence intervals

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
