import { calcYoY } from '../../lib/series';

export default async function handler(req, res) {
  const { seriesId, yoyCalc } = req.query;
  const apiKey = process.env.FRED_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'FRED_API_KEY environment variable not set.' });
  }
  if (!seriesId) {
    return res.status(400).json({ error: 'seriesId query param required.' });
  }

  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=asc&observation_start=1970-01-01`;
    const fredRes = await fetch(url);

    if (!fredRes.ok) {
      const text = await fredRes.text();
      return res.status(fredRes.status).json({ error: `FRED error: ${fredRes.status}`, detail: text });
    }

    const data = await fredRes.json();
    let observations = data.observations
      .filter(o => o.value !== '.')
      .map(o => ({ date: o.date, value: parseFloat(o.value) }));

    if (yoyCalc === 'true') {
      observations = calcYoY(observations);
    }

    // Cache for 5 minutes on Vercel edge
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    res.status(200).json({ observations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
