export const GROUPS = [
  { key: 'macro',      label: 'Macroeconomic' },
  { key: 'realestate', label: 'Real Estate' },
  { key: 'labor',      label: 'Labor & Income' },
  { key: 'rates',      label: 'Rates & Credit' },
];

export const SERIES = [
  // ── Macro ──
  {
    id: 'CPIAUCSL',
    label: 'CPI Inflation',
    title: 'Consumer Price Index — All Urban Consumers',
    subtitle: 'Year-over-year percent change',
    format: 'pct', unit: 'YoY %', freq: 'Monthly',
    yoyCalc: true, group: 'macro',
  },
  {
    id: 'PCEPI',
    label: 'PCE Inflation',
    title: 'Personal Consumption Expenditures Price Index',
    subtitle: 'Year-over-year percent change',
    format: 'pct', unit: 'YoY %', freq: 'Monthly',
    yoyCalc: true, group: 'macro',
  },
  {
    id: 'PCEPILFE',
    label: 'Core PCE',
    title: 'PCE Excluding Food and Energy (Core PCE)',
    subtitle: 'Year-over-year percent change — the Fed\'s preferred inflation measure',
    format: 'pct', unit: 'YoY %', freq: 'Monthly',
    yoyCalc: true, group: 'macro',
  },
  {
    id: 'A191RL1Q225SBEA',
    label: 'Real GDP Growth',
    title: 'Real Gross Domestic Product Growth Rate',
    subtitle: 'Annualized percent change from prior quarter, seasonally adjusted',
    format: 'pct', unit: '% QoQ ann.', freq: 'Quarterly',
    group: 'macro',
  },
  {
    id: 'RSXFS',
    label: 'Retail Sales',
    title: 'Advance Retail Sales: Retail & Food Services',
    subtitle: 'Year-over-year percent change, seasonally adjusted',
    format: 'pct', unit: 'YoY %', freq: 'Monthly',
    yoyCalc: true, group: 'macro',
  },

  // ── Real Estate ──
  {
    id: 'MSPUS', row: 1,
    label: 'Median Home Price',
    title: 'Median Sales Price of Houses Sold in the U.S.',
    subtitle: 'Not seasonally adjusted, USD',
    format: 'dollars', unit: 'USD', freq: 'Quarterly',
    group: 'realestate',
  },
  {
    id: 'ASPUS', row: 1,
    label: 'Avg Home Price',
    title: 'Average Sales Price of Houses Sold in the U.S.',
    subtitle: 'Not seasonally adjusted, USD',
    format: 'dollars', unit: 'USD', freq: 'Quarterly',
    group: 'realestate',
  },
  {
    id: 'ZHVI', row: 1,
    label: 'Zillow Home Value',
    title: 'Zillow Home Value Index (ZHVI)',
    subtitle: 'Typical home value, national, smoothed & seasonally adjusted — all homes mid-tier',
    format: 'dollars', unit: 'USD', freq: 'Monthly',
    source: 'zillow', group: 'realestate',
  },
  {
    id: 'ZORI', row: 1,
    label: 'Zillow Rent Index',
    title: 'Zillow Observed Rent Index (ZORI)',
    subtitle: 'Typical asking rent, national average, smoothed — all homes & apartments',
    format: 'rent', unit: 'USD/mo', freq: 'Monthly',
    source: 'zillow', group: 'realestate',
  },
  {
    id: 'MORTGAGE30US', row: 2,
    label: '30-Year Mortgage',
    title: '30-Year Fixed Rate Mortgage Average',
    subtitle: 'Weekly, percent per annum',
    format: 'pct', unit: '% p.a.', freq: 'Weekly',
    group: 'realestate',
  },
  {
    id: 'EXHOSLUSM495S', row: 2,
    label: 'Existing Home Sales',
    title: 'Existing Home Sales',
    subtitle: 'Seasonally adjusted annual rate, millions of units',
    format: 'millions', unit: 'M units', freq: 'Monthly',
    group: 'realestate',
  },
  {
    id: 'MSACSR', row: 2,
    label: "Months' Supply",
    title: "Months' Supply of Houses in the United States",
    subtitle: "Seasonally adjusted — under 5 is seller's market, over 7 is buyer's market",
    format: 'months', unit: 'Months', freq: 'Monthly',
    group: 'realestate',
  },

  // ── Labor & Income ──
  {
    id: 'UNRATE',
    label: 'Unemployment',
    title: 'Unemployment Rate',
    subtitle: 'Seasonally adjusted, percent of civilian labor force',
    format: 'pct', unit: '% of LF', freq: 'Monthly',
    group: 'labor',
  },
  {
    id: 'ICSA',
    label: 'Jobless Claims',
    title: 'Initial Claims for Unemployment Insurance',
    subtitle: 'Seasonally adjusted, weekly, thousands of persons',
    format: 'claims', unit: 'K persons', freq: 'Weekly',
    group: 'labor',
  },
  {
    id: 'CES0500000003',
    label: 'Avg Hourly Earnings',
    title: 'Average Hourly Earnings of All Employees',
    subtitle: 'Year-over-year percent change, seasonally adjusted',
    format: 'pct', unit: 'YoY %', freq: 'Monthly',
    yoyCalc: true, group: 'labor',
  },
  {
    id: 'MEHOINUSA672N',
    label: 'Median HH Income',
    title: 'Real Median Household Income in the United States',
    subtitle: 'Annual, 2023 CPI-U-RS adjusted dollars',
    format: 'dollars', unit: 'USD', freq: 'Annual',
    dateFormat: 'year',
    group: 'labor',
  },

  // ── Rates & Credit ──
  {
    id: 'FEDFUNDS',
    label: 'Fed Funds Rate',
    title: 'Federal Funds Effective Rate',
    subtitle: 'Monthly average, percent per annum',
    format: 'pct', unit: '% p.a.', freq: 'Monthly',
    group: 'rates',
  },
  {
    id: 'DGS2',
    label: '2-Year Treasury',
    title: '2-Year Treasury Constant Maturity Rate',
    subtitle: 'Daily, percent per annum',
    format: 'pct', unit: '% p.a.', freq: 'Daily',
    group: 'rates',
  },
  {
    id: 'DGS10',
    label: '10-Year Treasury',
    title: '10-Year Treasury Constant Maturity Rate',
    subtitle: 'Daily, percent per annum',
    format: 'pct', unit: '% p.a.', freq: 'Daily',
    group: 'rates',
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
  if (format === 'claims') return Math.round(val).toLocaleString() + 'K';
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
  else if (format === 'claims') text = sign + Math.round(Math.abs(chg)).toLocaleString() + 'K';
  else text = sign + chg.toFixed(2);
  return { text, cls: chg >= 0 ? 'pos' : 'neg' };
}

export function dateLabel(dateStr, fmt) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (fmt === 'year') return d.getFullYear().toString();
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
