# Prediction Market Aggregator

A real-time dashboard aggregating prediction market data from multiple sources to inform SPY/QQQ options trading strategies.

## Features

- **Real-time odds aggregation** from Polymarket, Kalshi, PredictIt, Metaculus, and more
- **Federal Reserve policy tracking** via CME FedWatch and Kalshi
- **Economic event monitoring** with FRED integration
- **Election odds** from political prediction markets
- **SPY/QQQ impact scoring** for each event
- **Historical trend visualization** with interactive charts
- **Source attribution** and confidence intervals

## Data Sources

- **Polymarket** - Decentralized prediction markets (Gamma API)
- **Kalshi** - CFTC-regulated event contracts
- **PredictIt** - Political prediction markets
- **Metaculus** - Community forecasting platform
- **Manifold Markets** - Open-source play-money markets
- **FRED** - Federal Reserve economic data
- **CME FedWatch** - Fed funds futures probabilities

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- API keys (see `.env.example`)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your API keys
```

### Development

```bash
# Run development server
npm run dev

# Open http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
prediction-scraper/
├── src/
│   ├── app/              # Next.js app directory (App Router)
│   │   ├── api/         # API routes
│   │   ├── page.tsx     # Main dashboard page
│   │   └── layout.tsx   # Root layout
│   ├── components/      # React components
│   │   ├── markets/     # Market-specific widgets
│   │   ├── charts/      # Data visualization
│   │   └── ui/          # Reusable UI components
│   ├── lib/             # Utility libraries
│   │   ├── scrapers/    # Data source scrapers
│   │   ├── services/    # Business logic
│   │   └── utils/       # Helper functions
│   └── types/           # TypeScript types
├── public/              # Static assets
└── docs/                # Additional documentation
```

## API Routes

- `GET /api/markets/fed-policy` - Federal Reserve rate decision probabilities
- `GET /api/markets/elections` - Election odds from multiple sources
- `GET /api/markets/economic` - Economic event probabilities
- `GET /api/markets/aggregate` - Aggregated market impact analysis
- `GET /api/events/[id]` - Individual event details

## Environment Variables

See `.env.example` for required configuration.

**Required:**
- `FRED_API_KEY` - Free API key from [FRED](https://fred.stlouisfed.org/)

**Optional but Recommended:**
- `KALSHI_API_KEY` - For Kalshi market data
- `POLYMARKET_API_KEY` - For premium Polymarket features

## Development

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## Deployment

Recommended: Deploy to [Vercel](https://vercel.com)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## License

Apache License 2.0 - See [LICENSE](./LICENSE) for details

## Contributing

See [CLAUDE.md](./CLAUDE.md) for development guidelines.

## Disclaimer

This tool is for informational purposes only. Prediction market odds do not guarantee future outcomes. Always conduct your own research before making trading decisions.
