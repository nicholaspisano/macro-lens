// Fetches upcoming FRED release dates for a list of release IDs
// Returns set of release IDs with a scheduled date within the next 24 hours

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const FRED_KEY = process.env.FRED_API_KEY;
  if (!FRED_KEY) return new Response(JSON.stringify({ error: 'No API key' }), { status: 500 });

  // All unique release IDs we care about
  const releaseIds = [10, 54, 53, 82, 153, 22, 147, 231, 50, 386, 167, 132];

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const pad = n => String(n).padStart(2, '0');
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

  const dueSoon = new Set();

  try {
    // Fetch upcoming release dates for all releases in one call
    const url = `https://api.stlouisfed.org/fred/releases/dates?api_key=${FRED_KEY}&file_type=json&realtime_start=${fmt(now)}&realtime_end=${fmt(tomorrow)}&include_release_dates_with_no_data=false&limit=1000`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`FRED ${res.status}`);
    const data = await res.json();

    for (const entry of (data.release_dates || [])) {
      const releaseDate = new Date(entry.date + 'T00:00:00');
      if (releaseDate <= tomorrow) {
        dueSoon.add(entry.release_id);
      }
    }
  } catch (e) {
    console.error('releases fetch error:', e);
  }

  return new Response(JSON.stringify({ dueSoon: [...dueSoon] }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=1800', // cache 30 min
    },
  });
}
