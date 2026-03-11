// Yahoo Finance unofficial endpoint — no API key required
// Used for fast-moving market/commodity prices

const TICKERS = {
  'CL=F':    { label: 'WTI Crude Oil',       unit: '$/bbl' },
  'NG=F':    { label: 'Natural Gas',          unit: '$/MMBtu' },
  'RB=F':    { label: 'Gasoline (Wholesale)', unit: '$/gal' },
};

async function fetchYahooQuote(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=2y`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; macro-lens/1.0)',
      'Accept': 'application/json',
    }
  });
  if (!res.ok) throw new Error(`Yahoo Finance error ${res.status} for ${ticker}`);
  const data = await res.json();

  const result = data?.chart?.result?.[0];
  if (!result) throw new Error(`No data returned for ${ticker}`);

  const timestamps = result.timestamp;
  const closes = result.indicators?.quote?.[0]?.close;
  const meta = result.meta;

  if (!timestamps || !closes) throw new Error(`Missing price data for ${ticker}`);

  // Build observations array, filter nulls
  const observations = [];
  for (let i = 0; i < timestamps.length; i++) {
    if (closes[i] !== null && closes[i] !== undefined) {
      const date = new Date(timestamps[i] * 1000).toISOString().slice(0, 10);
      observations.push({ date, value: Math.round(closes[i] * 1000) / 1000 });
    }
  }

  // Last updated = most recent market close
  const lastUpdated = observations[observations.length - 1]?.date ?? null;
  const currentPrice = meta?.regularMarketPrice ?? observations[observations.length - 1]?.value;

  // Replace last observation with current market price for freshness
  if (currentPrice && observations.length) {
    observations[observations.length - 1].value = Math.round(currentPrice * 1000) / 1000;
  }

  return { observations, lastUpdated, latestObsDate: lastUpdated };
}

export default async function handler(req, res) {
  const { ticker } = req.query;

  if (!ticker || !TICKERS[ticker]) {
    return res.status(400).json({ error: `Unknown ticker: ${ticker}. Available: ${Object.keys(TICKERS).join(', ')}` });
  }

  try {
    const data = await fetchYahooQuote(ticker);
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60'); // 5min cache
    res.status(200).json(data);
  } catch (err) {
    console.error(`[yahoo] error for ${ticker}:`, err.message);
    res.status(500).json({ error: err.message });
  }
}
