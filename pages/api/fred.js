import { calcYoY } from '../../lib/series';

export default async function handler(req, res) {
  const { seriesId, yoyCalc } = req.query;
  const apiKey = process.env.FRED_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'FRED_API_KEY not set.' });
  if (!seriesId) return res.status(400).json({ error: 'seriesId required.' });

  try {
    // Fetch observations + series info in parallel
    const [obsRes, infoRes] = await Promise.all([
      fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=asc&observation_start=1970-01-01`),
      fetch(`https://api.stlouisfed.org/fred/series?series_id=${seriesId}&api_key=${apiKey}&file_type=json`),
    ]);

    if (!obsRes.ok) throw new Error(`FRED observations error ${obsRes.status}`);
    if (!infoRes.ok) throw new Error(`FRED series info error ${infoRes.status}`);

    const [obsData, infoData] = await Promise.all([obsRes.json(), infoRes.json()]);

    let observations = obsData.observations
      .filter(o => o.value !== '.')
      .map(o => ({ date: o.date, value: parseFloat(o.value) }));

    if (yoyCalc === 'true') observations = calcYoY(observations);

    // Pull last_updated and the date of the most recent observation
    const seriesInfo = infoData.seriess?.[0] ?? {};
    const lastUpdated = seriesInfo.last_updated ?? null;       // e.g. "2025-03-05 08:01:03-06"
    const latestObsDate = observations.length
      ? observations[observations.length - 1].date
      : null;

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    res.status(200).json({ observations, lastUpdated, latestObsDate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
