export const SERIES = [
  {
    id: 'CPIAUCSL',
    label: 'CPI Inflation',
    title: 'Consumer Price Index — All Urban Consumers',
    subtitle: 'Year-over-year percent change',
    format: 'pct',
    unit: 'YoY %',
    freq: 'Monthly',
    yoyCalc: true,
  },
  {
    id: 'GDP',
    label: 'Real GDP',
    title: 'Gross Domestic Product',
    subtitle: 'Seasonally adjusted annual rate, billions of chained 2017 dollars',
    format: 'trillions',
    unit: '$T',
    freq: 'Quarterly',
  },
  {
    id: 'FEDFUNDS',
    label: 'Fed Funds Rate',
    title: 'Federal Funds Effective Rate',
    subtitle: 'Monthly average, percent per annum',
    format: 'pct',
    unit: '% p.a.',
    freq: 'Monthly',
  },
  {
    id: 'UNRATE',
    label: 'Unemployment',
    title: 'Unemployment Rate',
    subtitle: 'Seasonally adjusted, percent of civilian labor force',
    format: 'pct',
    unit: '% of LF',
    freq: 'Monthly',
  },
  {
    id: 'MSPUS',
    label: 'Median Home Price',
    title: 'Median Sales Price of Houses Sold in the U.S.',
    subtitle: 'Not seasonally adjusted, USD',
    format: 'dollars',
    unit: 'USD',
    freq: 'Quarterly',
  },
  {
    id: 'DGS10',
    label: '10-Year Treasury',
    title: '10-Year Treasury Constant Maturity Rate',
    subtitle: 'Daily, percent per annum',
    format: 'pct',
    unit: '% p.a.',
    freq: 'Daily',
  },
  {
    id: 'MORTGAGE30US',
    label: '30-Year Mortgage',
    title: '30-Year Fixed Rate Mortgage Average',
    subtitle: 'Weekly, percent per annum',
    format: 'pct',
    unit: '% p.a.',
    freq: 'Weekly',
  },
  {
    id: 'TOTALSL',
    label: 'Consumer Credit',
    title: 'Total Consumer Credit Outstanding',
    subtitle: 'Seasonally adjusted, billions of dollars',
    format: 'trillions',
    unit: '$B',
    freq: 'Monthly',
  },
  {
    id: 'CES0500000003',
    label: 'Avg Hourly Earnings',
    title: 'Average Hourly Earnings of All Employees',
    subtitle: 'Year-over-year percent change, seasonally adjusted',
    format: 'pct',
    unit: 'YoY %',
    freq: 'Monthly',
    yoyCalc: true,
  },
  {
    id: 'MEHOINUSA672N',
    label: 'Median HH Income',
    title: 'Real Median Household Income in the United States',
    subtitle: 'Annual, 2023 CPI-U-RS adjusted dollars',
    format: 'dollars',
    unit: 'USD',
    freq: 'Annual',
  },
  {
    id: 'RSXFS',
    label: 'Retail Sales',
    title: 'Advance Retail Sales: Retail & Food Services',
    subtitle: 'Year-over-year percent change, seasonally adjusted',
    format: 'pct',
    unit: 'YoY %',
    freq: 'Monthly',
    yoyCalc: true,
  },
];

export function formatValue(val, format) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  if (format === 'pct') return val.toFixed(2) + '%';
  if (format === 'trillions') return '$' + (val / 1000).toFixed(2) + 'T';
  if (format === 'dollars') return '$' + Math.round(val / 1000) + 'K';
  return val.toFixed(2);
}

export function formatChange(chg, format) {
  if (chg === null || chg === undefined || isNaN(chg)) return { text: '—', cls: 'neu' };
  const sign = chg >= 0 ? '+' : '';
  let text;
  if (format === 'pct') text = sign + chg.toFixed(2) + 'pp';
  else if (format === 'trillions') text = sign + '$' + (chg / 1000).toFixed(2) + 'T';
  else if (format === 'dollars') text = sign + '$' + Math.round(Math.abs(chg) / 1000) + 'K';
  else text = sign + chg.toFixed(2);
  return { text, cls: chg >= 0 ? 'pos' : 'neg' };
}

export function dateLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
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
  const years = range === '1Y' ? 1 : range === '5Y' ? 5 : 10;
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - years);
  return data.filter(d => new Date(d.date) >= cutoff);
}
