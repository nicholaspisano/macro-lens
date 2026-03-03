# MacroLens — U.S. Economic Dashboard

A clean, Bloomberg-inspired dashboard displaying live U.S. macroeconomic indicators from the FRED API.

## Indicators
- CPI Inflation (YoY%)
- Real GDP
- Federal Funds Rate
- Unemployment Rate
- Median Home Price

## Deploy to Vercel (5 minutes)

### 1. Install dependencies locally (optional, to test first)
```bash
npm install
npm run dev
# Open http://localhost:3000
```

### 2. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/macro-lens.git
git push -u origin main
```

### 3. Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo
3. In **Environment Variables**, add:
   - **Name:** `FRED_API_KEY`
   - **Value:** `7d1451f6aa179eec44bbf19b07386858`
4. Click **Deploy** — done!

## Adding New Data Sources

### Add another FRED series
In `lib/series.js`, add an entry to the `SERIES` array:
```js
{
  id: 'M2SL',             // FRED series ID
  label: 'M2 Money Supply',
  title: 'M2 Money Stock',
  subtitle: 'Seasonally adjusted, billions of dollars',
  format: 'trillions',    // 'pct' | 'trillions' | 'dollars'
  unit: '$T',
  freq: 'Monthly',
}
```

### Add a new data source (e.g. BLS, World Bank)
1. Create a new API route: `pages/api/bls.js`
2. Fetch server-side (no CORS issues)
3. Return `{ observations: [{ date, value }] }`
4. Call it from `pages/index.js` alongside the FRED calls

## Architecture
- **`pages/api/fred.js`** — Server-side proxy to FRED API (bypasses CORS)
- **`lib/series.js`** — Series definitions + shared formatting utilities
- **`pages/index.js`** — Dashboard UI
- Auto-refreshes every **5 minutes**
- Vercel edge caches FRED responses for **5 minutes** to avoid rate limits
# macro-lens
# macro-lens
# macro-lens
# macro-lens
# macro-lens
