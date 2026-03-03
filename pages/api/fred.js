import { calcYoY } from '../../lib/series';

export default async function handler(req, res) {
  const { seriesId, yoyCalc } = req.query;
  const apiKey = process.env.FRED_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'FRED_API_KEY not set.' });
  if (!seriesId) return res.status(400).json({ error: 'seriesId required.' });

  try {
    const [obsRes, infoRes] = await Promise.all([
      fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=asc&observation_start=1970-01-01`),
      fetch(`https://api.stlouisfed.org/fred/series?series_id=${seriesId}&api_key=${apiKey}&file_type=json`),
    ]);

    if (!obsRes.ok) throw new Error(`FRED observations error ${obsRes.status}`);
    if (!infoRes.ok) throw new Error(`FRED series info error ${infoRes.status}`);

    const obsData = await obsRes.json();
    const infoData = await infoRes.json();

    let observations = obsData.observations
      .filter(o => o.value !== '.')
      .map(o => ({ date: o.date, value: parseFloat(o.value) }));

    if (yoyCalc === 'true') observations = calcYoY(observations);

    const seriesInfo = infoData.seriess?.[0] ?? {};

    // last_updated from FRED looks like "2025-03-05 08:01:03-06"
    const lastUpdated = seriesInfo.last_updated ?? null;
    const latestObsDate = observations.length
      ? observations[observations.length - 1].date
      : null;

    // Log for debugging
    console.log(`[fred] ${seriesId} last_updated=${lastUpdated} latestObs=${latestObsDate}`);

    // No caching so metadata is always fresh
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ observations, lastUpdated, latestObsDate });
  } catch (err) {
    console.error(`[fred] error for ${seriesId}:`, err.message);
    res.status(500).json({ error: err.message });
  }
}
