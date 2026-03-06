export default async function handler(req, res) {
  const apiKey = process.env.FRED_API_KEY;
  const seriesId = req.query.seriesId || 'CPIAUCSL';

  try {
    const infoRes = await fetch(`https://api.stlouisfed.org/fred/series?series_id=${seriesId}&api_key=${apiKey}&file_type=json`);
    const infoData = await infoRes.json();
    const seriesInfo = infoData.seriess?.[0] ?? null;

    res.status(200).json({
      series_id: seriesId,
      all_fields: seriesInfo,
      last_updated: seriesInfo?.last_updated ?? 'NOT FOUND',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
