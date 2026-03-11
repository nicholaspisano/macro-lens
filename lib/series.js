export const GROUPS = [
  { key: 'news',       label: 'In the News' },
  { key: 'macro',      label: 'Macroeconomic' },
  { key: 'realestate', label: 'Real Estate' },
  { key: 'labor',      label: 'Labor & Income' },
  { key: 'rates',      label: 'Rates & Credit' },
];

export const SERIES = [
  // ── Macro ──
  {
    id: 'CPIAUCSL', releaseId: 10,, row: 1,
    label: 'CPI Inflation',
    title: 'Consumer Price Index — All Urban Consumers',
    subtitle: 'Year-over-year percent change',
    format: 'pct', unit: 'YoY %', freq: 'Monthly',
    description: 'The most widely cited inflation measure. Tracks price changes for everyday goods and services. Above 2% signals rising inflation; the Fed targets 2% annually.',
    yoyCalc: true, group: 'macro',
  },
  {
    id: 'PCEPI', releaseId: 54,, row: 1,
    label: 'PCE Inflation',
    title: 'Personal Consumption Expenditures Price Index',
    subtitle: 'Year-over-year percent change',
    format: 'pct', unit: 'YoY %', freq: 'Monthly',
    description: 'Broader inflation measure than CPI, covering more spending categories. Watched closely alongside Core PCE to understand overall price pressures.',
    yoyCalc: true, group: 'macro',
  },
  {
    id: 'PCEPILFE', releaseId: 54,, row: 1,
    label: 'Core PCE',
    title: 'PCE Excluding Food and Energy (Core PCE)',
    subtitle: 'Year-over-year percent change — the Fed\'s preferred inflation measure',
    format: 'pct', unit: 'YoY %', freq: 'Monthly',
    description: "The Fed's preferred inflation gauge. Strips out volatile food and energy prices for a cleaner read on underlying inflation. Fed targets 2% on this measure.",
    yoyCalc: true, group: 'macro',
  },
  {
    id: 'A191RL1Q225SBEA', releaseId: 53,, row: 2, dateFormat: 'quarter',
    label: 'Real GDP Growth',
    title: 'Real Gross Domestic Product Growth Rate',
    subtitle: 'Annualized percent change from prior quarter, seasonally adjusted',
    format: 'pct', unit: '% QoQ ann.', freq: 'Quarterly',
    description: 'The headline measure of economic growth. Annualized percent change in inflation-adjusted output. Two consecutive negative quarters is the informal definition of a recession.',
        group: 'macro',
  },
  {
    id: 'RSXFS', releaseId: 82,, row: 2,
    label: 'Retail Sales',
    title: 'Advance Retail Sales: Retail & Food Services',
    subtitle: 'Year-over-year percent change, seasonally adjusted',
    format: 'pct', unit: 'YoY %', freq: 'Monthly',
    description: 'Measures consumer spending at stores and restaurants. Since consumption drives ~70% of GDP, this is a real-time pulse on economic health.',
    yoyCalc: true, group: 'macro',
  },

  {
    id: 'UMCSENT', releaseId: 153,,
    label: 'Consumer Sentiment',
    title: 'University of Michigan Consumer Sentiment Index',
    subtitle: 'Monthly survey of consumer confidence in the U.S. economy',
    format: 'index1', unit: 'Index', freq: 'Monthly',
    row: 2, group: 'macro',
    description: 'Measures how optimistic consumers feel about their finances and the economy. A leading indicator — sentiment drops often precede slowdowns in spending and growth.',
  },

  // ── Real Estate ──
  {
    id: 'MSPUS', releaseId: 22,, row: 1,
    label: 'Median Sale Price',
    title: 'Median Sales Price of Houses Sold in the U.S.',
    subtitle: 'Not seasonally adjusted, USD',
    format: 'dollars', unit: 'USD', freq: 'Quarterly',
    description: 'The midpoint of all home sale prices nationally. A direct measure of housing affordability — rising prices reduce the pool of eligible buyers.',
        group: 'realestate',
  },
  {
    id: 'ASPUS', releaseId: 22,, row: 1,
    label: 'Avg Sale Price',
    title: 'Average Sales Price of Houses Sold in the U.S.',
    subtitle: 'Not seasonally adjusted, USD',
    format: 'dollars', unit: 'USD', freq: 'Quarterly',
    description: 'The average of all home sale prices. Skews higher than median due to luxury sales. Useful for tracking the top end of the market.',
        group: 'realestate',
  },
  {
    id: 'ZHVI', row: 1,
    label: 'Zillow Home Value',
    title: 'Zillow Home Value Index (ZHVI)',
    subtitle: 'Typical home value, national, smoothed & seasonally adjusted — all homes mid-tier',
    format: 'dollars', unit: 'USD', freq: 'Monthly',
    description: 'Zillow\'s estimate of the typical home value nationally, updated monthly. More current than Census-based measures and reflects the full housing stock, not just recent sales.',
        source: 'zillow', group: 'realestate',
  },
  {
    id: 'ZORI', row: 1,
    label: 'Zillow Rent Index',
    title: 'Zillow Observed Rent Index (ZORI)',
    subtitle: 'Typical asking rent, national average, smoothed — all homes & apartments',
    format: 'rent', unit: 'USD/mo', freq: 'Monthly',
    description: 'Tracks typical asking rents across all home types nationally. A leading indicator of shelter inflation, which feeds directly into CPI.',
        source: 'zillow', group: 'realestate',
  },
  {
    id: 'MORTGAGE30US', releaseId: 147,, row: 2,
    label: '30-Year Mortgage',
    title: '30-Year Fixed Rate Mortgage Average',
    subtitle: 'Weekly, percent per annum',
    format: 'pct', unit: '% p.a.', freq: 'Weekly',
    description: 'The average interest rate on a 30-year fixed mortgage. Directly determines monthly payments — a 1% rise on a $400K loan adds ~$250/month.',
        group: 'realestate',
  },
  {
    id: 'EXHOSLUSM495S', releaseId: 231,, row: 2,
    label: 'Existing Home Sales',
    title: 'Existing Home Sales',
    subtitle: 'Seasonally adjusted annual rate, millions of units',
    format: 'millions', unit: 'M units', freq: 'Monthly',
    description: 'Monthly volume of previously-owned homes sold. Low sales despite high prices signals affordability stress; rising sales indicate buyer confidence.',
        group: 'realestate',
  },
  {
    id: 'MSACSR', releaseId: 231,, row: 2,
    label: "Months' Supply",
    title: "Months' Supply of Houses in the United States",
    subtitle: "Seasonally adjusted — under 5 is seller's market, over 7 is buyer's market",
    format: 'months', unit: 'Months', freq: 'Monthly',
    description: "How many months it would take to sell all homes currently listed at the current sales pace. Under 5 months is a seller's market; over 7 is a buyer's market.",
        group: 'realestate',
  },

  // ── Labor & Income ──
  {
    id: 'UNRATE', releaseId: 50,,
    label: 'Unemployment',
    title: 'Unemployment Rate',
    subtitle: 'Seasonally adjusted, percent of civilian labor force',
    format: 'pct', unit: '% of LF', freq: 'Monthly',
    description: 'Percent of the labor force actively looking for work but unemployed. The Fed targets ~4% as consistent with stable prices. Below 4% can signal an overheating economy.',
        group: 'labor',
  },
  {
    id: 'ICSA', releaseId: 386,,
    label: 'Jobless Claims',
    title: 'Initial Claims for Unemployment Insurance',
    subtitle: 'Seasonally adjusted, weekly, thousands of persons',
    format: 'claims', unit: 'K persons', freq: 'Weekly',
    description: 'New unemployment insurance filings each week. A real-time leading indicator — rising claims signal layoffs before they show in the monthly unemployment rate.',
        group: 'labor',
  },
  {
    id: 'CES0500000003', releaseId: 50,,
    label: 'Avg Hourly Earnings',
    title: 'Average Hourly Earnings of All Employees',
    subtitle: 'Year-over-year percent change, seasonally adjusted',
    format: 'pct', unit: 'YoY %', freq: 'Monthly',
    description: 'Year-over-year change in what workers earn per hour. Rising wages are good for workers but can fuel inflation if they outpace productivity growth.',
    yoyCalc: true, group: 'labor',
  },
  {
    id: 'MEHOINUSA672N', releaseId: 167,,
    label: 'Median HH Income',
    title: 'Real Median Household Income in the United States',
    subtitle: 'Annual, 2023 CPI-U-RS adjusted dollars',
    format: 'dollars', unit: 'USD', freq: 'Annual',
    dateFormat: 'year',
    description: 'Inflation-adjusted income for the household at the exact middle of the income distribution. The single best measure of whether typical Americans are getting ahead.',
        group: 'labor',
  },

  // ── Rates & Credit ──
  {
    id: 'FEDFUNDS', releaseId: 132,,
    label: 'Fed Funds Rate',
    title: 'Federal Funds Effective Rate',
    subtitle: 'Monthly average, percent per annum',
    format: 'pct', unit: '% p.a.', freq: 'Monthly',
    description: 'The interest rate banks charge each other for overnight loans — set by the Fed. The most powerful lever in monetary policy; it influences every other interest rate in the economy.',
        group: 'rates',
  },
  {
    id: 'DGS2',
    label: '2-Year Treasury',
    title: '2-Year Treasury Constant Maturity Rate',
    subtitle: 'Daily, percent per annum',
    format: 'pct', unit: '% p.a.', freq: 'Daily',
    description: 'Market expectations for Fed policy over the next two years. Moves quickly with inflation data and Fed signals. When it rises above the 10-year, the yield curve inverts — a historically reliable recession warning.',
        group: 'rates',
  },
  {
    id: 'DGS10',
    label: '10-Year Treasury',
    title: '10-Year Treasury Constant Maturity Rate',
    subtitle: 'Daily, percent per annum',
    format: 'pct', unit: '% p.a.', freq: 'Daily',
    description: 'The benchmark for long-term borrowing costs globally. Influences mortgage rates, corporate bonds, and stock valuations. Reflects market expectations for long-run growth and inflation.',
        group: 'rates',
  },
  // ── In the News ──
  {
    id: 'CL=F',
    label: 'WTI Crude Oil',
    title: 'WTI Crude Oil Futures',
    subtitle: 'Front-month futures contract, USD per barrel',
    format: 'commodity', unit: '$/bbl', freq: 'Daily',
    source: 'yahoo', group: 'news',
    description: 'The U.S. benchmark oil price. Moves immediately on geopolitical events, OPEC decisions, and supply disruptions. Feeds into gasoline, shipping, and manufacturing costs.',
  },
  {
    id: 'NG=F',
    label: 'Natural Gas',
    title: 'Natural Gas Futures',
    subtitle: 'Front-month futures contract, USD per MMBtu',
    format: 'commodity', unit: '$/MMBtu', freq: 'Daily',
    source: 'yahoo', group: 'news',
    description: 'Benchmark U.S. natural gas price. Highly volatile — driven by weather, storage levels, and LNG export demand. Feeds directly into electricity and heating costs.',
  },
  {
    id: 'RB=F',
    label: 'Gasoline (Wholesale)',
    title: 'RBOB Gasoline Futures',
    subtitle: 'Front-month futures contract, USD per gallon — leads retail pump prices by days',
    format: 'commodity', unit: '$/gal', freq: 'Daily',
    source: 'yahoo', group: 'news',
    description: 'Wholesale gasoline price before taxes and retail markup. Add ~$1.00–1.20 to estimate pump price. A leading indicator of what consumers will pay at the gas station within days.',
  },
];

export function formatValue(val, format) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  if (format === 'pct') return val.toFixed(2) + '%';
  if (format === 'trillions') return '$' + (val / 1000).toFixed(2) + 'T';
  if (format === 'dollars') return '$' + (val / 1000).toFixed(1) + 'K';
  if (format === 'thousands') return Math.round(val).toLocaleString() + 'K';
  if (format === 'millions') return (val / 1000000).toFixed(2) + 'M';
  if (format === 'months') return val.toFixed(1) + ' mo';
  if (format === 'rent') return '$' + Math.round(val).toLocaleString() + '/mo';
  if (format === 'claims') return Math.round(val / 1000).toLocaleString() + 'K';
  if (format === 'commodity') return '$' + val.toFixed(2);
  if (format === 'index1') return val.toFixed(1);
  return val.toFixed(2);
}

export function formatChange(chg, format) {
  if (chg === null || chg === undefined || isNaN(chg)) return { text: '—', cls: 'neu' };
  const sign = chg >= 0 ? '+' : '';
  let text;
  if (format === 'pct') text = sign + chg.toFixed(2) + 'pp';
  else if (format === 'trillions') text = sign + '$' + (chg / 1000).toFixed(2) + 'T';
  else if (format === 'dollars') text = sign + '$' + Math.round(Math.abs(chg) / 1000) + 'K';
  else if (format === 'thousands') text = sign + Math.round(chg).toLocaleString() + 'K';
  else if (format === 'millions') text = sign + (chg / 1000000).toFixed(2) + 'M';
  else if (format === 'months') text = sign + chg.toFixed(1) + ' mo';
  else if (format === 'rent') text = sign + '$' + Math.round(Math.abs(chg)).toLocaleString() + '/mo';
  else if (format === 'claims') text = sign + Math.round(Math.abs(chg) / 1000).toLocaleString() + 'K';
  else if (format === 'commodity') text = sign + '$' + Math.abs(chg).toFixed(2);
  else if (format === 'index1') text = sign + chg.toFixed(1);
  else text = sign + chg.toFixed(2);
  return { text, cls: chg >= 0 ? 'pos' : 'neg' };
}

export function dateLabel(dateStr, fmt) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (fmt === 'year') return d.getFullYear().toString();
  if (fmt === 'quarter') {
    const q = Math.floor(d.getMonth() / 3) + 1;
    return `Q${q} ${d.getFullYear()}`;
  }
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function calcYoY(observations) {
  const result = [];
  for (let i = 0; i < observations.length; i++) {
    const curr = observations[i];
    const target = new Date(curr.date);
    target.setFullYear(target.getFullYear() - 1);
    let best = null, bestDiff = Infinity;
    for (let j = i - 1; j >= Math.max(0, i - 18); j--) {
      const d = new Date(observations[j].date);
      const diff = Math.abs(d - target);
      if (diff < bestDiff) { bestDiff = diff; best = observations[j]; }
    }
    if (best && bestDiff < 46 * 86400 * 1000 && best.value !== 0) {
      const yoy = ((curr.value - best.value) / best.value) * 100;
      result.push({ date: curr.date, value: parseFloat(yoy.toFixed(3)) });
    }
  }
  return result;
}

export function filterRange(data, range) {
  if (!data) return [];
  if (range === 'MAX') return data;
  const months = range === '3M' ? 3 : range === '1Y' ? 12 : range === '5Y' ? 60 : 120;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return data.filter(d => new Date(d.date) >= cutoff);
}
