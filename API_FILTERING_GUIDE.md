# Prediction Market API Filtering Guide

This guide shows you how to filter prediction market data by category, tags, and impact scores.

## 🎯 Available API Endpoints

### 1. **SPY Impact Events** (S&P 500)
Get events that affect SPY options pricing.

```bash
GET /api/markets/spy?limit=20
```

**Example Response:**
```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "eventId": "polymarket-123",
      "event": {
        "title": "Will the Fed cut rates by 50bps at December FOMC?",
        "category": "fed_policy",
        "tags": ["SPY", "QQQ", "fed", "rates"],
        "closeDate": "2025-12-18T00:00:00.000Z"
      },
      "aggregatedProbability": 0.48,
      "confidence": 0.85,
      "impactScore": {
        "score": 95,
        "level": "CRITICAL"
      }
    }
  ]
}
```

---

### 2. **QQQ Impact Events** (Nasdaq-100)
Get tech-focused events that affect QQQ.

```bash
GET /api/markets/qqq?limit=20
```

**Use Cases:**
- Tech regulation predictions
- AI policy decisions
- China trade disputes
- Fed rate decisions (affects all markets)

---

### 3. **Category-Specific Endpoints**

#### Fed Policy Events
```bash
GET /api/markets/fed-policy
```

**Returns:** Interest rate decisions, FOMC meetings, monetary policy

#### Election Events
```bash
GET /api/markets/elections
```

**Returns:** Presidential, congressional, gubernatorial elections

#### Economic Data Events
```bash
GET /api/markets/economic
```

**Returns:** CPI, jobs reports, GDP, unemployment predictions

---

### 4. **Advanced Filtering** ⭐ MOST POWERFUL
Filter by **category + tags + impact score** simultaneously.

```bash
GET /api/markets/filter?category={category}&tags={tags}&minImpact={score}&limit={n}
```

**Parameters:**
- `category` (optional): `fed_policy`, `election`, `economic_data`, `government`, `geopolitical`
- `tags` (optional): Comma-separated list (e.g., `SPY,QQQ`)
- `minImpact` (optional): Minimum impact score (0-100)
- `limit` (optional): Max results (default: 50)

#### Example Queries:

**Get CRITICAL Fed events affecting SPY:**
```bash
GET /api/markets/filter?category=fed_policy&tags=SPY&minImpact=80&limit=10
```

**Get high-impact QQQ events (any category):**
```bash
GET /api/markets/filter?tags=QQQ&minImpact=60&limit=15
```

**Get all election events with medium+ impact:**
```bash
GET /api/markets/filter?category=election&minImpact=40
```

**Get SPY AND QQQ events (affects both):**
```bash
GET /api/markets/filter?tags=SPY,QQQ&minImpact=50
```

---

## 📊 Event Categories

| Category | Base Impact | Examples |
|----------|-------------|----------|
| `fed_policy` | 90 | FOMC meetings, rate decisions, Fed chair speeches |
| `economic_data` | 75 | Jobs report, CPI, GDP, unemployment |
| `election` | 60 | Presidential, congressional elections |
| `government` | 40 | Shutdowns, debt ceiling, budget |
| `geopolitical` | 50 | Wars, trade disputes, sanctions |

---

## 🎯 Impact Score Levels

| Score Range | Level | What it means |
|-------------|-------|---------------|
| 80-100 | `CRITICAL` | Expect major SPY/QQQ volatility |
| 60-79 | `HIGH` | Significant market impact likely |
| 40-59 | `MEDIUM` | Moderate impact on options pricing |
| 0-39 | `LOW` | Minor or sector-specific impact |

---

## 🏷️ Common Tags

| Tag | Description |
|-----|-------------|
| `SPY` | Affects S&P 500 / SPY options |
| `QQQ` | Affects Nasdaq-100 / QQQ options |
| `fed` | Federal Reserve related |
| `rates` | Interest rate decisions |
| `inflation` | CPI, inflation data |
| `jobs` | Employment reports |
| `tech` | Technology sector |
| `china` | China trade/policy |

---

## 💡 Use Cases & Examples

### For Options Traders

**1. Find next week's high-impact events:**
```bash
GET /api/markets/filter?minImpact=70&limit=10
```

**2. Get Fed rate decision probabilities:**
```bash
GET /api/markets/fed-policy
```

**3. Check election odds affecting markets:**
```bash
GET /api/markets/elections
```

---

### For Volatility Trading

**Get events with 50/50 odds (maximum uncertainty = high VIX):**
```javascript
// Fetch all events
const response = await fetch('/api/markets/aggregate');
const data = await response.json();

// Filter for uncertainty (probability near 50%)
const uncertain = data.data.filter(event => {
  const prob = event.aggregatedProbability;
  return prob >= 0.4 && prob <= 0.6 && event.impactScore.score >= 60;
});
```

---

### For Macro Trading

**Get all market-moving events in next 30 days:**
```bash
GET /api/markets/filter?minImpact=60&limit=30
```

Filter by closeDate in your client code to get events within your timeframe.

---

## 🔄 Data Sources

All endpoints aggregate data from:
- **Polymarket** - Crypto-based prediction markets
- **Kalshi** - CFTC-regulated markets
- **Metaculus** - Community forecasting
- **Manifold** - Play-money markets

Each event shows:
- **Aggregated Probability** - Weighted average across sources
- **Confidence** - How much sources agree (0-1)
- **Impact Score** - SPY/QQQ impact calculation

---

## 🚀 Quick Start Examples

### JavaScript/TypeScript
```typescript
// Get SPY impact events
const spy = await fetch('http://localhost:3000/api/markets/spy?limit=10');
const spyData = await spy.json();

console.log(`Found ${spyData.count} SPY events`);
spyData.data.forEach(event => {
  console.log(`${event.event.title}: ${(event.aggregatedProbability * 100).toFixed(1)}%`);
});
```

### Python
```python
import requests

# Get high-impact QQQ events
response = requests.get(
    'http://localhost:3000/api/markets/filter',
    params={'tags': 'QQQ', 'minImpact': 70, 'limit': 10}
)

data = response.json()
for event in data['data']:
    print(f"{event['event']['title']}: {event['impactScore']['level']}")
```

### cURL
```bash
# Get critical Fed policy events
curl "http://localhost:3000/api/markets/filter?category=fed_policy&minImpact=80"
```

---

## ⚙️ Response Format

All endpoints return:

```typescript
{
  success: boolean;
  count: number;
  filters?: {
    category: string;
    tags: string[];
    minImpactScore: number | "none";
    limit: number;
  };
  data: AggregatedOdds[];
  metadata: {
    source: "aggregated";
    sources: string[];
    timestamp: string; // ISO 8601
  };
}
```

---

## 📝 Notes

1. **Caching**: Results are cached for 5-15 minutes depending on event proximity
2. **Rate Limiting**: Individual API sources have rate limits, but aggregator handles this
3. **Real-time**: Data freshness depends on source APIs (typically < 5 min old)
4. **Filtering**: Tags are additive (OR logic) - matches if ANY tag is present

---

## 🎓 Advanced: Custom Filtering

For complex queries, fetch from `/api/markets/aggregate` and filter client-side:

```typescript
const response = await fetch('/api/markets/aggregate');
const { data } = await response.json();

// Custom filter: High-impact events in next 7 days affecting both SPY and QQQ
const filtered = data.filter(event => {
  const daysUntil = (new Date(event.event.closeDate) - new Date()) / (1000 * 60 * 60 * 24);
  return (
    event.impactScore.score >= 70 &&
    daysUntil <= 7 &&
    daysUntil >= 0 &&
    event.event.tags.includes('SPY') &&
    event.event.tags.includes('QQQ')
  );
});
```

---

**Need help?** Check the main README or open an issue on GitHub.
