# Historical Tracking System

## Overview

The Historical Tracking System captures daily snapshots of prediction market probabilities and tracks event outcomes to measure prediction accuracy over time. This builds trust in the system and validates that prediction markets actually work.

## Features

- **Daily Snapshots**: Automatic capture of all active prediction market events
- **Event Resolution**: Record final outcomes and calculate accuracy metrics
- **Brier Score**: Industry-standard accuracy measurement (0 = perfect, 0.25 = random, 1 = worst)
- **Calibration Analysis**: Measure how well-calibrated predictions are
- **Probability Trends**: Track how probabilities change over time
- **Biggest Movers**: Identify events with largest probability shifts

## Database Schema

### PredictionSnapshot Table
Stores daily snapshots of prediction probabilities.

```sql
CREATE TABLE prediction_snapshots (
  id UUID PRIMARY KEY,
  event_id TEXT,
  event_title TEXT,
  category TEXT,
  snapshot_date DATETIME,
  close_date DATETIME,
  probability FLOAT,
  impact_score INTEGER,
  vix_correlation FLOAT,
  sources TEXT, -- JSON array
  source_count INTEGER,
  confidence FLOAT,
  tags TEXT -- JSON array
);
```

### EventResolution Table
Stores final outcomes and accuracy metrics.

```sql
CREATE TABLE event_resolutions (
  id UUID PRIMARY KEY,
  event_id TEXT UNIQUE,
  event_title TEXT,
  resolved_date DATETIME,
  outcome BOOLEAN,
  notes TEXT,
  final_probability FLOAT,
  brier_score FLOAT,
  calibration_error FLOAT,
  total_snapshots INTEGER
);
```

## API Endpoints

### 1. Capture Snapshot

**Endpoint**: `POST /api/history/snapshot`

Manually trigger a snapshot capture. Normally run via cron job.

```bash
curl -X POST http://localhost:3000/api/history/snapshot
```

**Response**:
```json
{
  "success": true,
  "message": "Snapshot captured successfully",
  "data": {
    "snapshotCount": 42,
    "errors": []
  }
}
```

### 2. Get Snapshot Statistics

**Endpoint**: `GET /api/history/snapshot`

Get overview statistics about captured snapshots.

```bash
curl http://localhost:3000/api/history/snapshot
```

**Response**:
```json
{
  "success": true,
  "data": {
    "totalSnapshots": 1250,
    "uniqueEvents": 45,
    "oldestSnapshot": "2025-10-01T00:00:00.000Z",
    "newestSnapshot": "2025-11-16T15:22:59.258Z",
    "snapshotsLast24h": 42,
    "snapshotsLast7d": 315
  }
}
```

### 3. Get Event History

**Endpoint**: `GET /api/history/events/[eventId]?limit=30&days=30`

Get historical snapshots and probability trends for a specific event.

**Parameters**:
- `limit`: Number of snapshots to return (default: 30)
- `days`: Number of days to analyze for trends (default: 30)

```bash
curl "http://localhost:3000/api/history/events/cme-fomc-2025-12-17?limit=30"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "eventId": "cme-fomc-2025-12-17",
    "history": [
      {
        "snapshotDate": "2025-11-16T15:22:59.258Z",
        "probability": 0.65,
        "impactScore": 100,
        "vixCorrelation": 0.58,
        "confidence": 1
      }
    ],
    "trend": {
      "currentProbability": 0.65,
      "change24h": 0.05,
      "change7d": 0.12,
      "change30d": -0.08,
      "chartData": [...]
    },
    "resolution": null,
    "metadata": {
      "snapshotCount": 30,
      "dateRange": {...}
    }
  }
}
```

### 4. Get Biggest Movers

**Endpoint**: `GET /api/history/movers?days=7&limit=10`

Get events with largest probability changes.

**Parameters**:
- `days`: Time window (default: 7)
- `limit`: Max results (default: 10)

```bash
curl "http://localhost:3000/api/history/movers?days=7&limit=10"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "timeframe": "7 days",
    "gainers": [
      {
        "eventId": "fomc-rate-cut",
        "eventTitle": "Fed cuts rates by 25bps",
        "category": "fed_policy",
        "currentProbability": 75,
        "change": 25,
        "changePercent": 50,
        "momentum": "bullish"
      }
    ],
    "losers": [...],
    "all": [...]
  }
}
```

### 5. Resolve Event

**Endpoint**: `POST /api/history/resolve`

Record the final outcome of an event and calculate accuracy metrics.

**Body**:
```json
{
  "eventId": "cme-fomc-2025-12-17",
  "eventTitle": "FOMC Meeting - Dec 2025",
  "outcome": true,
  "notes": "Fed maintained rates at 4.50-4.75%"
}
```

```bash
curl -X POST http://localhost:3000/api/history/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "cme-fomc-2025-12-17",
    "eventTitle": "FOMC Meeting - Dec 2025",
    "outcome": true,
    "notes": "Fed maintained rates"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Event resolved successfully",
  "data": {
    "eventId": "cme-fomc-2025-12-17",
    "eventTitle": "FOMC Meeting - Dec 2025",
    "outcome": true,
    "metrics": {
      "brierScore": 0.1225,
      "calibrationError": 0.35,
      "finalProbability": 0.65,
      "totalSnapshots": 30
    },
    "interpretation": {
      "brierScoreQuality": "Good",
      "description": "Brier score of 0.1225 (0=perfect, 0.25=random, 1=worst)"
    }
  }
}
```

**Brier Score Interpretation**:
- **< 0.10**: Excellent prediction
- **0.10 - 0.25**: Good prediction (better than random)
- **0.25 - 0.50**: Fair prediction
- **> 0.50**: Poor prediction

### 6. Get All Resolutions

**Endpoint**: `GET /api/history/resolve?limit=50&orderBy=brierScore&order=asc`

Get all resolved events with their accuracy metrics.

**Parameters**:
- `limit`: Max results (default: 50)
- `orderBy`: Sort field - `resolvedDate` or `brierScore` (default: resolvedDate)
- `order`: Sort order - `asc` or `desc` (default: desc)

```bash
curl "http://localhost:3000/api/history/resolve?orderBy=brierScore&order=asc&limit=10"
```

### 7. Get System Accuracy

**Endpoint**: `GET /api/history/accuracy`

Get system-wide accuracy metrics and calibration analysis.

```bash
curl http://localhost:3000/api/history/accuracy
```

**Response**:
```json
{
  "success": true,
  "data": {
    "overall": {
      "totalResolutions": 45,
      "averageBrierScore": 0.15,
      "averageCalibrationError": 0.12,
      "quality": "Good",
      "benchmarks": {
        "perfect": 0,
        "random": 0.25,
        "worst": 1,
        "current": 0.15
      }
    },
    "byCategory": [
      {
        "category": "fed_policy",
        "eventCount": 12,
        "averageBrierScore": 0.12,
        "quality": "Good"
      }
    ],
    "bestPredictions": [...],
    "worstPredictions": [...],
    "calibration": {
      "description": "Shows how well-calibrated predictions are...",
      "curve": [
        {
          "probabilityRange": "60-70%",
          "predictedProbability": 0.65,
          "actualFrequency": 0.67,
          "count": 15
        }
      ],
      "isWellCalibrated": true
    }
  }
}
```

## Automation Setup

### Daily Snapshot Cron Job

For production, set up a cron job to capture snapshots daily:

```bash
# Run at midnight every day
0 0 * * * curl -X POST http://localhost:3000/api/history/snapshot
```

Or use a Node.js scheduler in your application:

```typescript
// src/lib/jobs/snapshot-scheduler.ts
import cron from 'node-cron';
import { SnapshotService } from '@/lib/services/snapshot-service';

export function startSnapshotScheduler() {
  // Run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('[Scheduler] Running daily snapshot...');
    const result = await SnapshotService.captureSnapshot();
    console.log('[Scheduler] Snapshot complete:', result);
  });

  console.log('[Scheduler] Daily snapshot job scheduled');
}
```

### Environment Variables

Add to `.env`:

```env
# Historical Data
ENABLE_HISTORICAL_DATA=true
SNAPSHOT_SCHEDULE="0 0 * * *"  # Daily at midnight
SNAPSHOT_RETENTION_DAYS=365    # Keep snapshots for 1 year
```

## Usage Examples

### Example 1: Track Fed Policy Predictions

```bash
# 1. Capture daily snapshots
curl -X POST http://localhost:3000/api/history/snapshot

# 2. After FOMC meeting, resolve the event
curl -X POST http://localhost:3000/api/history/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "cme-fomc-2025-12-17",
    "eventTitle": "FOMC Meeting - Dec 2025",
    "outcome": true,
    "notes": "Fed held rates at 4.50-4.75%"
  }'

# 3. Check system accuracy
curl http://localhost:3000/api/history/accuracy
```

### Example 2: Monitor Probability Shifts

```bash
# Get events with biggest changes in last 7 days
curl "http://localhost:3000/api/history/movers?days=7&limit=5"

# Get detailed history for trending event
curl "http://localhost:3000/api/history/events/some-event-id?limit=30"
```

### Example 3: Validate Prediction Quality

```bash
# Get best predictions
curl "http://localhost:3000/api/history/resolve?orderBy=brierScore&order=asc&limit=10"

# Get worst predictions
curl "http://localhost:3000/api/history/resolve?orderBy=brierScore&order=desc&limit=10"

# Check calibration
curl http://localhost:3000/api/history/accuracy | jq '.data.calibration'
```

## Understanding Metrics

### Brier Score

The Brier Score measures the accuracy of probabilistic predictions:

```
Brier Score = (1/N) × Σ(forecast - outcome)²
```

Where:
- `forecast` = predicted probability (0-1)
- `outcome` = actual result (0 or 1)
- `N` = number of snapshots

**Example**:
- Event has 65% probability (0.65)
- Event happens (outcome = 1)
- Brier Score = (0.65 - 1.0)² = 0.1225

**Quality Ratings**:
- 0.0000 - 0.1000: **Excellent** - Very accurate predictions
- 0.1000 - 0.2500: **Good** - Better than random guessing
- 0.2500 - 0.5000: **Fair** - Approaching random
- 0.5000+: **Poor** - Worse than random

### Calibration

Calibration measures whether predicted probabilities match actual frequencies.

**Example**:
- You predict 10 events at 70% probability each
- If exactly 7 of them happen, you're perfectly calibrated
- If 9 happen, you're under-confident
- If 5 happen, you're over-confident

The calibration curve shows this across all probability ranges.

## Database Maintenance

### Clean Up Old Snapshots

```typescript
import { SnapshotService } from '@/lib/services/snapshot-service';

// Delete snapshots older than 365 days
const deleted = await SnapshotService.cleanupOldSnapshots(365);
console.log(`Deleted ${deleted} old snapshots`);
```

### Export Historical Data

```bash
# Export all snapshots to CSV
npx prisma db execute --file export-snapshots.sql > snapshots.csv

# Or use Prisma Client
npx tsx scripts/export-data.ts
```

## Next Steps

1. **Week 1**: Set up daily snapshot cron job
2. **Week 2**: Start resolving closed events manually
3. **Week 3**: Build calibration dashboard
4. **Week 4**: Automate event resolution from sources
5. **Month 2**: Add accuracy alerts when Brier score exceeds threshold

## ROI

**Value Delivered**:
- Proves prediction markets work → Builds user trust
- Identifies best/worst performing categories → Improve data sources
- Tracks probability changes → Catch trends early
- Validates trading signals → Reduce losses from bad predictions

**Time to Build**: 1-2 days (COMPLETED ✓)

**Ongoing Effort**: 5 minutes/day to resolve events

---

Built: November 16, 2025
Status: ✅ **PRODUCTION READY**
