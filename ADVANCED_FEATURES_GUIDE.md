##Advanced Prediction Market Features Guide

Complete guide to advanced filtering, sector analysis, volatility tracking, and time-based queries.

---

## 🆕 New Event Categories

We've expanded from 5 to **17 event categories**:

### Core Economic/Political
- `fed_policy` (90 impact) - FOMC meetings, rate decisions
- `economic_data` (75 impact) - CPI, jobs, GDP
- `recession` (85 impact) - Recession probability markets
- `volatility` (70 impact) - VIX and market volatility predictions
- `election` (60 impact) - Presidential, congressional elections
- `government` (40 impact) - Shutdowns, debt ceiling
- `geopolitical` (50 impact) - Wars, trade disputes

### Corporate & Regulatory
- `corporate` (45 impact) - Earnings, M&A, IPOs, bankruptcies
- `regulatory` (55 impact) - FDA approvals, antitrust, SEC rulings

### Sector-Specific
- `tech` (50 impact) - Technology sector events
- `healthcare` (45 impact) - Healthcare/biotech sector
- `energy` (50 impact) - Oil, gas, renewables
- `financials` (55 impact) - Banking, insurance, fintech

### Additional
- `climate` (30 impact) - Weather, natural disasters
- `crypto` (40 impact) - Crypto events (affects QQQ tech)
- `sports` (10 impact) - Sentiment indicator only

---

## 📊 Market Sectors

All events are now classified by **11 SPDR sector ETFs**:

| Sector | ETF | Description |
|--------|-----|-------------|
| Technology | `XLK` | Apple, Microsoft, Google, Nvidia |
| Healthcare | `XLV` | Pharma, biotech, medical devices |
| Financials | `XLF` | Banks, insurance, fintech |
| Energy | `XLE` | Oil, gas, renewable energy |
| Consumer Discretionary | `XLY` | Retail, auto, entertainment |
| Consumer Staples | `XLP` | Food, beverages, household products |
| Industrials | `XLI` | Manufacturing, aerospace, defense |
| Utilities | `XLU` | Electric, gas, water utilities |
| Real Estate | `XLRE` | REITs, property companies |
| Materials | `XLB` | Mining, chemicals, commodities |
| Communication | `XLC` | Telecom, media, Netflix |

---

## 🎯 New API Endpoints

### 1. Volatility/VIX Correlation
**Get events likely to move VIX**

```bash
GET /api/markets/volatility?threshold=0.6&days=30
```

**Parameters:**
- `threshold` (0-1): VIX correlation threshold (default: 0.6)
- `days`: Days ahead to look (default: 30)

**Response:**
```json
{
  "success": true,
  "count": 8,
  "data": [
    {
      "event": {
        "title": "Will Fed cut rates by 50bps?",
        "category": "fed_policy",
        "tags": ["SPY", "QQQ", "fed"]
      },
      "aggregatedProbability": 0.48,
      "impactScore": {"score": 95, "level": "CRITICAL"},
      "vixCorrelation": 0.85,        // ⬅️ NEW
      "uncertainty": 0.96,           // ⬅️ NEW (50/50 odds = max)
      "volatilityLevel": "very_high" // ⬅️ NEW
    }
  ],
  "summary": {
    "avgUncertainty": 0.72,
    "highVolatilityCount": 5,
    "veryHighVolatilityCount": 3,
    "fifty50Count": 2
  }
}
```

**Use Cases:**
- Find events for volatility trading (long VIX)
- Identify potential option straddle/strangle opportunities
- Predict VIX spikes before they happen

---

### 2. Sector-Specific Events
**Get events affecting specific sectors**

```bash
GET /api/markets/sector?sector=XLK,XLV&minImpact=50
```

**Parameters:**
- `sector`: Comma-separated sector ETF codes (XLK, XLV, XLF, etc.)
- `minImpact`: Minimum impact score (0-100)
- `limit`: Max results (default: 50)

**Response:**
```json
{
  "success": true,
  "count": 12,
  "filters": {
    "sectors": ["XLK", "XLV"],
    "sectorNames": ["Technology", "Healthcare"]
  },
  "data": [
    {
      "event": {
        "title": "FDA approval for Alzheimer's drug",
        "category": "regulatory"
      },
      "sectors": ["XLV"],              // ⬅️ NEW: All affected sectors
      "primarySector": "XLV",          // ⬅️ NEW: Main sector
      "impactScore": {"score": 65}
    }
  ],
  "sectorStats": [                     // ⬅️ NEW: Per-sector statistics
    {
      "sector": "XLK",
      "sectorName": "Technology",
      "eventsCount": 8,
      "avgImpactScore": 58
    }
  ]
}
```

**Use Cases:**
- **Sector rotation trading**: See which sectors have most events
- **Pair trades**: XLK vs XLV based on relative event count
- **Sector-specific options**: Trade options on sector ETFs

---

### 3. Time Horizon Filtering
**Get events in specific time windows**

```bash
GET /api/markets/horizon?period=7d&minImpact=60
```

**Periods:**
- `7d` - Next 7 days (imminent)
- `30d` - Next 30 days (near-term)
- `90d` - Next 90 days (mid-term)
- `q_current` - Current quarter
- `q_next` - Next quarter
- `y_current` - This year

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "event": {"title": "FOMC Meeting - Dec 2025"},
      "daysUntilClose": 5,          // ⬅️ NEW
      "isImminent": true,            // ⬅️ NEW (<7 days)
      "isNearTerm": true             // ⬅️ NEW (<30 days)
    }
  ],
  "horizonSummary": {              // ⬅️ NEW
    "imminent": 3,    // 0-7 days
    "nearTerm": 8,    // 8-30 days
    "midTerm": 15,    // 31-90 days
    "longTerm": 24    // 90+ days
  }
}
```

**Use Cases:**
- **Weekly options**: Get imminent events for 0DTE/1DTE trades
- **Monthly planning**: See what's coming in next 30 days
- **Quarterly rebalancing**: Events affecting Q4/Q1

---

### 4. Comprehensive Dashboard
**All-in-one trading dashboard**

```bash
GET /api/markets/dashboard
```

**Returns:**
- Top 10 high impact events
- Upcoming events (next 7 days)
- Top SPY-focused events
- Top QQQ-focused events
- High VIX correlation events
- 50/50 events (max uncertainty)
- Sector rotation signals
- Recession probability
- Time horizon breakdown

**Response (abbreviated):**
```json
{
  "success": true,
  "dashboard": {
    "highImpactEvents": [...],
    "upcomingEvents": [...],

    "spyFocused": {
      "count": 15,
      "topEvents": [...]
    },

    "qqqFocused": {
      "count": 12,
      "topEvents": [...]
    },

    "volatility": {
      "summary": {
        "avgUncertainty": 0.68,
        "highVolatilityCount": 7,
        "veryHighVolatilityCount": 2
      },
      "highVixCorrelation": [...],
      "fifty50Events": [...]
    },

    "sectorRotation": [
      {
        "sector": "XLK",
        "sectorName": "Technology",
        "momentum": 0.35,        // -1 to 1 (bearish to bullish)
        "eventsCount": 12,
        "avgImpactScore": 58,
        "sentiment": "bullish"   // bullish/neutral/bearish
      }
    ],

    "recessionProbability": 0.28,  // 28% chance

    "timeHorizonBreakdown": {
      "imminent": 3,    // 0-7 days
      "nearTerm": 8,    // 8-30 days
      "midTerm": 15,    // 31-90 days
      "longTerm": 24    // 90+ days
    },

    "summary": {
      "totalEvents": 50,
      "totalHighImpact": 15,
      "totalUpcoming7Days": 3,
      "criticalEvents": 2
    }
  }
}
```

**Use Case:** Single endpoint for complete market overview

---

## 🧮 Volatility Indicators Explained

### Uncertainty Score (0-1)
Measures how close probability is to 50/50:
- **1.0** = Exactly 50% (maximum uncertainty)
- **0.5** = 75% or 25% (moderate uncertainty)
- **0.0** = 0% or 100% (no uncertainty)

**Formula:** `uncertainty = 1 - abs(0.5 - probability) * 2`

### VIX Correlation Score (0-1)
Likelihood that event will move VIX:
- **Components:**
  - 40% Uncertainty (how close to 50/50)
  - 30% Disagreement (variance across sources)
  - 30% Impact Score (event importance)

**Interpretation:**
- **>0.8** = Very likely to spike VIX
- **0.6-0.8** = High VIX potential
- **<0.6** = Low VIX impact

### Volatility Levels
- **VERY_HIGH**: Probability 45-55% (trade volatility)
- **HIGH**: Probability 35-65% (elevated vol expected)
- **MODERATE**: Probability 25-75% (normal vol)
- **LOW**: Probability <25% or >75% (low vol)

---

## 💡 Advanced Use Cases

### 1. Volatility Trading Strategy
```bash
# Get high VIX events in next 7 days
curl "/api/markets/volatility?threshold=0.7&days=7"

# Trade VIX calls/puts or VXX based on results
```

### 2. Sector Rotation
```bash
# Compare tech vs healthcare
curl "/api/markets/sector?sector=XLK,XLV&minImpact=50"

# Check momentum scores - rotate to bullish sector
```

### 3. Event-Driven Options
```bash
# Get imminent high-impact events
curl "/api/markets/horizon?period=7d&minImpact=70"

# Buy straddles/strangles before event resolution
```

### 4. Recession Hedging
```bash
# Check recession probability
curl "/api/markets/dashboard" | jq '.dashboard.recessionProbability'

# If >40%, consider defensive sectors (XLU, XLP, XLV)
```

### 5. 50/50 Trades
```bash
# Find maximum uncertainty events
curl "/api/markets/volatility" | jq '.summary.fifty50Events'

# These are prime for volatility plays
```

---

## 📈 Sector Rotation Signals

The dashboard provides **momentum scores** for each sector:

**Momentum Calculation:**
```
momentum = (positive_events - negative_events) / total_events

Positive event: probability > 50%
Negative event: probability ≤ 50%
```

**Sentiment Classification:**
- **Bullish**: momentum > 0.2
- **Neutral**: momentum between -0.2 and 0.2
- **Bearish**: momentum < -0.2

**Example:**
```json
{
  "sector": "XLK",
  "momentum": 0.42,      // 42% bullish bias
  "eventsCount": 12,
  "avgImpactScore": 58,
  "sentiment": "bullish"
}
```

**Trading Signal:**
- Rotate INTO bullish sectors (high momentum)
- Rotate OUT OF bearish sectors (low momentum)
- Pair trade: Long bullish sector, Short bearish sector

---

## 🔍 Example Queries

### Find Tech Regulation Events
```bash
curl "/api/markets/filter?category=regulatory&tags=tech&minImpact=50"
```

### Upcoming Fed Decisions
```bash
curl "/api/markets/filter?category=fed_policy&tags=SPY,QQQ" \
  | jq '.data[] | select(.daysUntilClose <= 30)'
```

### High Uncertainty Energy Events
```bash
curl "/api/markets/sector?sector=XLE" \
  | jq '.data[] | select(.volatilityLevel == "very_high")'
```

### This Week's Critical Events
```bash
curl "/api/markets/horizon?period=7d&minImpact=80"
```

---

## 🎓 Trading Strategies

### Strategy 1: VIX Spike Trading
1. Call `/api/markets/volatility?threshold=0.8&days=7`
2. Identify events with VIX correlation >0.8
3. Buy VIX calls or VXX before event
4. Sell after volatility spike

### Strategy 2: Sector Rotation
1. Call `/api/markets/dashboard`
2. Check `sectorRotation` for momentum
3. Rotate portfolio to sectors with momentum >0.3
4. Avoid sectors with momentum <-0.3

### Strategy 3: Event Straddles
1. Call `/api/markets/volatility` for 50/50 events
2. Buy ATM straddles on SPY/QQQ
3. Event resolution creates directional move
4. Profit from volatility expansion

### Strategy 4: Recession Hedging
1. Monitor `/api/markets/dashboard → recessionProbability`
2. If >30%, increase defensive sectors (XLU, XLP, XLV)
3. If >50%, consider portfolio hedging (long puts)
4. If <20%, stay aggressive (XLK, XLY)

---

## 📊 Data Fields Reference

### Event Object
```typescript
{
  id: string;
  title: string;
  description: string;
  category: EventCategory;        // 17 categories
  closeDate: Date;
  tags: string[];                // SPY, QQQ, etc.
  sectors: MarketSector[];       // NEW: XLK, XLV, etc.
  volatilityLevel: VolatilityLevel; // NEW: very_high, high, moderate, low
}
```

### Aggregated Odds Object
```typescript
{
  eventId: string;
  event: PredictionMarketEvent;
  odds: MarketOdds[];
  aggregatedProbability: number;  // 0-1
  confidence: number;             // 0-1 (source agreement)
  impactScore: {
    score: number;                // 0-100
    level: ImpactLevel;           // CRITICAL, HIGH, MEDIUM, LOW
    factors: {
      category: number;
      proximity: number;
      uncertainty: number;
      volume: number;
    }
  };

  // NEW FIELDS (from volatility endpoint)
  vixCorrelation?: number;        // 0-1
  uncertainty?: number;           // 0-1
  volatilityLevel?: string;

  // NEW FIELDS (from sector endpoint)
  sectors?: MarketSector[];
  primarySector?: MarketSector;

  // NEW FIELDS (from horizon endpoint)
  daysUntilClose?: number;
  isImminent?: boolean;
  isNearTerm?: boolean;
}
```

---

## ⚙️ Configuration

All endpoints support standard query parameters:

- `limit`: Max results (default varies)
- `offset`: Pagination offset
- `minImpact`: Minimum impact score filter
- `category`: Filter by event category
- `tags`: Filter by tags (comma-separated)
- `sectors`: Filter by sectors (comma-separated)

---

## 🚀 Performance Tips

1. **Use caching**: Results cached for 5-15 min based on proximity
2. **Dashboard endpoint**: Single call for complete overview
3. **Filter early**: Use category/tags filters to reduce data
4. **Limit results**: Don't fetch more than you need

---

## 📝 Complete API Endpoint List

### Basic
- `GET /api/markets/spy` - SPY impact events
- `GET /api/markets/qqq` - QQQ impact events
- `GET /api/markets/fed-policy` - Fed policy events
- `GET /api/markets/elections` - Election events
- `GET /api/markets/economic` - Economic data events
- `GET /api/markets/aggregate` - All aggregated events

### Advanced (NEW)
- `GET /api/markets/filter` - Multi-parameter filtering
- `GET /api/markets/volatility` - VIX/volatility events
- `GET /api/markets/sector` - Sector-specific events
- `GET /api/markets/horizon` - Time-based filtering
- `GET /api/markets/dashboard` - Comprehensive overview

### Utility
- `GET /api/health` - API health check

---

**Need help? Check the main README or API_FILTERING_GUIDE.md**
