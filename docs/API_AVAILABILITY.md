# API Availability for Bulgarian Citizens

## ✅ Fully Available APIs

### 1. Manifold Markets
- **Status**: Fully accessible worldwide
- **Authentication**: Not required for reading markets
- **Base URL**: `https://api.manifold.markets/v0`
- **Rate Limit**: 500 requests/minute per IP
- **Key Endpoints**:
  - `GET /markets` - List all markets
  - `GET /market/[id]` - Get specific market
  - `GET /search-markets` - Search markets
- **Response Fields**: `probability`, `volume`, `closeTime`, `isResolved`, `resolution`
- **Documentation**: https://docs.manifold.markets/api

### 2. Metaculus
- **Status**: Globally accessible
- **Authentication**: Optional (not required for public forecasts)
- **Base URL**: `https://www.metaculus.com/api2`
- **Rate Limit**: Generous (no specific limit documented)
- **Key Endpoints**:
  - `GET /questions/` - List questions
  - `GET /posts/{id}/` - Get question details
- **Response Fields**: `community_prediction`, `status`, `resolution`, `possibilities`
- **Documentation**: https://www.metaculus.com/api2/schema/redoc/

### 3. FRED (Federal Reserve Economic Data)
- **Status**: Globally accessible
- **Authentication**: Free API key required
- **Base URL**: `https://api.stlouisfed.org/fred`
- **Rate Limit**: Very generous
- **Key Endpoints**:
  - `GET /series` - Get series info
  - `GET /series/observations` - Get data values
- **Response Fields**: `value`, `date`, `realtime_start`, `realtime_end`
- **Get API Key**: https://fred.stlouisfed.org/docs/api/api_key.html

### 4. Polymarket (Gamma API)
- **Status**: Read-only access available (Bulgaria not on restricted list)
- **Trading**: May require KYC (not needed for data aggregation)
- **Base URL**: `https://gamma-api.polymarket.com`
- **Rate Limit**: 1,000 calls/hour (free tier)
- **Key Endpoints**:
  - `GET /markets` - List markets
- **Response Fields**: `outcomePrices`, `volume`, `clobTokenIds`, `events`
- **Documentation**: https://docs.polymarket.com/

### 5. CME FedWatch Tool
- **Status**: Public data (web scraping)
- **Method**: HTML parsing or use pyfedwatch library
- **URL**: https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html
- **Data**: FOMC meeting rate decision probabilities
- **Alternative**: Calculate from Fed Funds futures data

### 6. PredictIt
- **Status**: Unclear restrictions for Bulgaria
- **Base URL**: `https://www.predictit.org/api/marketdata`
- **Endpoints**:
  - `GET /all/` - All markets
  - `GET /markets/{id}` - Specific market
- **Note**: Primarily US-focused, may have usage restrictions

## ❌ Restricted APIs

### Kalshi
- **Status**: RESTRICTED for Bulgarian citizens
- **Reason**: EU regulatory divergence
- **Restricted EU Countries**: Belarus, Belgium, Bulgaria, France, Italy, Monaco, Poland, Russia, Ukraine (regions), UK
- **Alternative**: Use other sources for Fed policy and economic event data

## Recommended Implementation Priority

**MVP (Phase 1)**:
1. Manifold Markets (easiest, full access)
2. Metaculus (forecasting, full access)
3. FRED (economic context, requires free key)

**Phase 2**:
4. Polymarket (comprehensive markets, read-only)
5. CME FedWatch (Fed policy, requires scraping)

**Phase 3 (Optional)**:
6. PredictIt (if accessible, political markets)
7. Reddit sentiment (supplementary)

## API Key Requirements

**Required**:
- None for MVP (Manifold, Metaculus work without keys)

**Recommended**:
- FRED API Key (free, instant) - https://fred.stlouisfed.org/

**Optional**:
- Polymarket API Key (for premium features)
- Reddit API credentials (for sentiment analysis)

## Geographic Access Notes

- **EU/Bulgaria specific**: Most US-based prediction markets (Kalshi, possibly PredictIt) have EU restrictions
- **Workaround**: Focus on global platforms (Metaculus, Manifold) and public data sources (FRED, CME)
- **Trading vs Data**: Even restricted platforms often allow API read access for public market data
