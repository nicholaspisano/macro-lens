// Zillow Research public CSV endpoints
// These are the standard public URLs — no API key required
const ZILLOW_URLS = {
  ZORI: 'https://files.zillowstatic.com/research/public_csvs/zori/Metro_zori_uc_sfrcondomfr_sm_month.csv',
  ZHVI: 'https://files.zillowstatic.com/research/public_csvs/zhvi/Metro_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv',
};

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  return lines.slice(1).map(line => {
    // Handle quoted fields with commas inside
    const cols = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { cols.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    cols.push(current.trim());
    const row = {};
    headers.forEach((h, i) => { row[h] = cols[i] ?? ''; });
    return row;
  });
}

function extractNationalTimeSeries(rows, metric) {
  // Find the United States / national row
  const nationalRow = rows.find(r => {
    const region = (r['RegionName'] || r['RegionName '] || '').trim();
    return region === 'United States';
  });

  if (!nationalRow) return null;

  // Date columns are formatted as YYYY-MM-DD
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const observations = [];

  Object.entries(nationalRow).forEach(([key, val]) => {
    if (datePattern.test(key) && val !== '' && val !== null) {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        observations.push({ date: key, value: Math.round(num * 100) / 100 });
      }
    }
  });

  // Sort ascending by date
  observations.sort((a, b) => a.date.localeCompare(b.date));
  return observations;
}

export default async function handler(req, res) {
  const { metric } = req.query;

  if (!metric || !ZILLOW_URLS[metric]) {
    return res.status(400).json({ error: `Unknown Zillow metric: ${metric}. Use ZORI or ZHVI.` });
  }

  try {
    const response = await fetch(ZILLOW_URLS[metric], {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; macro-lens/1.0)' }
    });

    if (!response.ok) {
      throw new Error(`Zillow CSV fetch failed: ${response.status}`);
    }

    const text = await response.text();
    const rows = parseCSV(text);
    const observations = extractNationalTimeSeries(rows, metric);

    if (!observations || observations.length === 0) {
      throw new Error('Could not find United States national row in Zillow CSV');
    }

    const lastUpdated = observations[observations.length - 1]?.date ?? null;

    res.setHeader('Cache-Control', 'max-age=3600'); // cache 1hr since it's monthly data
    res.status(200).json({ observations, lastUpdated, latestObsDate: lastUpdated });

  } catch (err) {
    console.error(`[zillow] error for ${metric}:`, err.message);
    res.status(500).json({ error: err.message });
  }
}
