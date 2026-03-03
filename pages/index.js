import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Filler, Tooltip, Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { SERIES, formatValue, formatChange, dateLabel, filterRange } from '../lib/series';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const REFRESH_MS = 5 * 60 * 1000;
const BLUE = '#44B2EF';
const BLUE_LIGHT = 'rgba(68,178,239,0.10)';
const BLUE_DIM = 'rgba(68,178,239,0.55)';

function fmtReleaseDate(str) {
  if (!str) return '—';
  // FRED returns "2025-03-05 08:01:03-06"
  const d = new Date(str.replace(' ', 'T'));
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard({ s }) {
  return (
    <div style={S.card}>
      <div style={S.cardLabel}>{s.label}</div>
      <div style={{ ...S.cardValue, ...S.skeleton }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
      <div style={{ marginTop: 8 }}>
        <div style={{ ...S.metaRow, marginBottom: 2 }}>
          <span style={S.metaKey}>Measures</span>
          <span style={{ ...S.metaVal, color: '#ccc' }}>—</span>
        </div>
        <div style={S.metaRow}>
          <span style={S.metaKey}>Released</span>
          <span style={{ ...S.metaVal, color: '#ccc' }}>—</span>
        </div>
      </div>
    </div>
  );
}

// ─── Metric card ──────────────────────────────────────────────────────────────
function MetricCard({ s, data, meta, active, onClick }) {
  if (!data || !data.length) return <SkeletonCard s={s} />;

  const latest = data[data.length - 1];
  const prev   = data[data.length - 2];
  const chg    = prev ? latest.value - prev.value : null;
  const { text, cls } = formatChange(chg, s.format);

  const isPos = cls === 'pos';
  const isNeg = cls === 'neg';

  const cardStyle = active
    ? { ...S.card, background: '#0f1c26', borderBottom: `2px solid ${BLUE}`, cursor: 'pointer' }
    : { ...S.card, cursor: 'pointer', borderBottom: '2px solid transparent' };

  const badgeStyle = active
    ? { ...S.badge, color: isPos ? '#6ee9a8' : isNeg ? '#f88' : 'rgba(255,255,255,0.4)', background: isPos ? 'rgba(110,233,168,0.12)' : isNeg ? 'rgba(255,136,136,0.12)' : 'transparent' }
    : { ...S.badge, color: isPos ? '#2a7d4f' : isNeg ? '#c0392b' : 'var(--text-tertiary)', background: isPos ? '#f0faf5' : isNeg ? '#fdf3f2' : 'transparent' };

  const dim = active ? 'rgba(255,255,255,0.35)' : 'var(--text-tertiary)';
  const bright = active ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)';

  return (
    <div style={cardStyle} onClick={onClick}>
      <div style={{ ...S.cardLabel, color: active ? BLUE_DIM : undefined }}>{s.label}</div>
      <div style={{ ...S.cardValue, color: active ? '#fff' : undefined }}>
        {formatValue(latest.value, s.format)}
      </div>
      <span style={{ ...badgeStyle, marginTop: 6, marginBottom: 10, display: 'inline-block' }}>{text}</span>
      <div style={{ marginTop: 2 }}>
        <div style={{ ...S.metaRow, marginBottom: 3 }}>
          <span style={{ ...S.metaKey, color: dim }}>Measures</span>
          <span style={{ ...S.metaVal, color: bright }}>{dateLabel(latest.date)}</span>
        </div>
        <div style={S.metaRow}>
          <span style={{ ...S.metaKey, color: dim }}>Released</span>
          <span style={{ ...S.metaVal, color: bright }}>{fmtReleaseDate(meta?.lastUpdated)}</span>
        </div>
      </div>
      <div style={{ ...S.cardSource, color: active ? 'rgba(255,255,255,0.2)' : undefined }}>FRED · {s.freq}</div>
    </div>
  );
}

// ─── Mini sparkline ───────────────────────────────────────────────────────────
function MiniChart({ s, data, meta }) {
  const filtered = filterRange(data, '5Y');
  if (!filtered.length) return null;

  const latest = data[data.length - 1];
  const prev   = data[data.length - 2];
  const chg    = prev ? latest.value - prev.value : null;
  const { text, cls } = formatChange(chg, s.format);

  const isPos = cls === 'pos';
  const isNeg = cls === 'neg';
  const badgeStyle = {
    ...S.badge,
    color: isPos ? '#2a7d4f' : isNeg ? '#c0392b' : 'var(--text-tertiary)',
    background: isPos ? '#f0faf5' : isNeg ? '#fdf3f2' : 'transparent',
  };

  const chartData = {
    labels: filtered.map(d => d.date),
    datasets: [{
      data: filtered.map(d => d.value),
      borderColor: BLUE,
      borderWidth: 1.5,
      backgroundColor: (ctx) => {
        if (!ctx.chart.chartArea) return 'transparent';
        const { top, bottom } = ctx.chart.chartArea;
        const g = ctx.chart.ctx.createLinearGradient(0, top, 0, bottom);
        g.addColorStop(0, 'rgba(68,178,239,0.12)');
        g.addColorStop(1, 'rgba(68,178,239,0.00)');
        return g;
      },
      fill: true, tension: 0.3, pointRadius: 0,
    }],
  };

  const opts = {
    responsive: true, maintainAspectRatio: false, animation: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: { display: false },
      y: {
        display: true,
        grid: { color: '#ebebea' },
        border: { display: false },
        ticks: { font: { family: "'IBM Plex Mono'", size: 9 }, color: '#a0a09d', maxTicksLimit: 4, callback: v => formatValue(v, s.format) }
      }
    }
  };

  return (
    <div style={S.miniPanel}>
      <div style={S.miniHeader}>
        <div>
          <div style={S.miniTitle}>{s.label}</div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 1 }}>
            <span>Measures {dateLabel(latest.date)}</span>
            {meta?.lastUpdated && <span style={{ marginLeft: 8, color: '#aaa' }}>· Released {fmtReleaseDate(meta.lastUpdated)}</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={S.miniValue}>{formatValue(latest.value, s.format)}</div>
          <span style={badgeStyle}>{text} vs prev</span>
        </div>
      </div>
      <div style={{ height: 110, padding: '8px 16px 12px' }}>
        <Line data={chartData} options={opts} />
      </div>
    </div>
  );
}

// ─── Main chart ───────────────────────────────────────────────────────────────
function MainChart({ s, data, meta, range, onRangeChange }) {
  if (!s || !data) {
    return (
      <div style={S.chartPanel}>
        <div style={S.chartPlaceholder}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}>
            SELECT AN INDICATOR TO VIEW CHART
          </span>
        </div>
      </div>
    );
  }

  const filtered = filterRange(data, range);
  const vals   = filtered.map(d => d.value);
  const latest = vals[vals.length - 1];
  const min    = Math.min(...vals);
  const max    = Math.max(...vals);
  const avg    = vals.reduce((a, b) => a + b, 0) / vals.length;

  const chartData = {
    labels: filtered.map(d => d.date),
    datasets: [{
      data: vals,
      borderColor: BLUE,
      borderWidth: 2,
      backgroundColor: (ctx) => {
        if (!ctx.chart.chartArea) return 'transparent';
        const { top, bottom } = ctx.chart.chartArea;
        const g = ctx.chart.ctx.createLinearGradient(0, top, 0, bottom);
        g.addColorStop(0, 'rgba(68,178,239,0.10)');
        g.addColorStop(1, 'rgba(68,178,239,0.00)');
        return g;
      },
      fill: true, tension: 0.3, pointRadius: 0,
      pointHoverRadius: 4,
      pointHoverBackgroundColor: BLUE,
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2,
    }],
  };

  const opts = {
    responsive: true, maintainAspectRatio: false, animation: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f1c26',
        titleColor: BLUE_DIM,
        bodyColor: '#fff',
        titleFont: { family: "'IBM Plex Mono'", size: 10 },
        bodyFont: { family: "'IBM Plex Mono'", size: 12, weight: '500' },
        padding: 10, cornerRadius: 4, displayColors: false,
        callbacks: {
          title: items => dateLabel(items[0].label),
          label: item => formatValue(item.raw, s.format),
        }
      }
    },
    scales: {
      x: {
        grid: { display: false }, border: { display: false },
        ticks: {
          font: { family: "'IBM Plex Mono'", size: 10 }, color: '#a0a09d',
          maxTicksLimit: 8, maxRotation: 0,
          callback: (_, i) => {
            const lbl = filtered[i]?.date;
            return lbl ? new Date(lbl + 'T00:00:00').getFullYear() : '';
          }
        }
      },
      y: {
        grid: { color: '#ebebea' }, border: { display: false },
        ticks: {
          font: { family: "'IBM Plex Mono'", size: 10 }, color: '#a0a09d',
          maxTicksLimit: 6, callback: v => formatValue(v, s.format)
        }
      }
    }
  };

  const ranges = ['1Y', '5Y', '10Y', 'MAX'];
  const latest_obs = data[data.length - 1];

  return (
    <div style={S.chartPanel}>
      <div style={S.chartHeader}>
        <div style={{ flex: 1 }}>
          <div style={S.chartTitle}>{s.title}</div>
          <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
            <span style={S.chartSubtitle}>{s.subtitle}</span>
            <span style={{ fontSize: 11, color: BLUE }}>
              Measures {dateLabel(latest_obs.date)}
              {meta?.lastUpdated && ` · Released ${fmtReleaseDate(meta.lastUpdated)}`}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24 }}>
          {[['Current', latest], ['High', max], ['Low', min], ['Avg', avg]].map(([lbl, val]) => (
            <div key={lbl} style={{ textAlign: 'right' }}>
              <div style={S.statLabel}>{lbl}</div>
              <div style={S.statValue}>{formatValue(val, s.format)}</div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 2 }}>
            {ranges.map(r => (
              <button key={r} onClick={() => onRangeChange(r)}
                style={r === range ? S.rangeTabActive : S.rangeTab}>
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ height: 280, padding: '16px 20px 12px' }}>
        <Line data={chartData} options={opts} />
      </div>
      <div style={S.chartFooter}>
        <span style={S.chartFooterText}>Source: Federal Reserve Bank of St. Louis (FRED)</span>
        <span style={S.chartFooterText}>{s.freq} frequency</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [seriesData, setSeriesData] = useState({});
  const [seriesMeta, setSeriesMeta] = useState({});
  const [activeId, setActiveId]     = useState(null);
  const [range, setRange]           = useState('5Y');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const timerRef = useRef(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        SERIES.map(async s => {
          const params = new URLSearchParams({ seriesId: s.id, yoyCalc: s.yoyCalc ? 'true' : 'false' });
          const res = await fetch(`/api/fred?${params}`);
          if (!res.ok) { const e = await res.json(); throw new Error(e.error || `HTTP ${res.status}`); }
          const { observations, lastUpdated, latestObsDate } = await res.json();
          return [s.id, { observations, lastUpdated, latestObsDate }];
        })
      );
      const dataMap = {}, metaMap = {};
      results.forEach(([id, { observations, lastUpdated, latestObsDate }]) => {
        dataMap[id] = observations;
        metaMap[id] = { lastUpdated, latestObsDate };
      });
      setSeriesData(dataMap);
      setSeriesMeta(metaMap);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    timerRef.current = setInterval(loadAll, REFRESH_MS);
    return () => clearInterval(timerRef.current);
  }, [loadAll]);

  const activeSeries = SERIES.find(s => s.id === activeId);
  const activeData   = activeId ? seriesData[activeId] : null;
  const activeMeta   = activeId ? seriesMeta[activeId] : null;

  return (
    <>
      <Head>
        <title>Clever Macro — U.S. Economic Dashboard</title>
        <meta name="description" content="Live U.S. macroeconomic indicators from FRED" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📊</text></svg>" />
      </Head>

      {/* ── Header ── */}
      <header style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={S.logo}>
            <span style={{ color: BLUE }}>CLEVER</span>
            <span style={{ color: 'var(--text-tertiary)', margin: '0 1px' }}>/</span>
            <span>MACRO</span>
          </div>
          <div style={S.headerDivider} />
          <div style={S.headerSub}>U.S. Economic Indicators — Federal Reserve Bank of St. Louis</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {lastRefresh && (
            <span style={S.lastUpdated}>
              Dashboard refreshed {lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button
            style={loading ? { ...S.refreshBtn, opacity: 0.5 } : S.refreshBtn}
            onClick={loadAll} disabled={loading}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}>
              <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* ── Status bar ── */}
      <div style={S.statusBar}>
        {SERIES.map((s, i) => {
          const d = seriesData[s.id];
          if (!d?.length) return null;
          const latest = d[d.length - 1];
          const prev   = d[d.length - 2];
          const chg    = prev ? latest.value - prev.value : null;
          const { text, cls } = formatChange(chg, s.format);
          const isPos = cls === 'pos', isNeg = cls === 'neg';
          const badgeStyle = {
            ...S.badge,
            color: isPos ? '#2a7d4f' : isNeg ? '#c0392b' : 'var(--text-tertiary)',
            background: isPos ? '#f0faf5' : isNeg ? '#fdf3f2' : 'transparent',
          };
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
              {i > 0 && <div style={S.statusSep} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={S.statusLabel}>{s.label}</span>
                <span style={{ ...S.statusValue, color: activeId === s.id ? BLUE : undefined }}>
                  {formatValue(latest.value, s.format)}
                </span>
                <span style={badgeStyle}>{text}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main ── */}
      <main style={S.main}>
        {error && <div style={S.errorBox}>⚠ {error}</div>}

        <div style={S.sectionHeader}>
          <span style={S.sectionTitle}>Key Indicators</span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Click a card to explore</span>
        </div>

        <div style={S.cardsGrid}>
          {SERIES.map(s => (
            <MetricCard
              key={s.id} s={s}
              data={seriesData[s.id]}
              meta={seriesMeta[s.id]}
              active={activeId === s.id}
              onClick={() => setActiveId(s.id)}
            />
          ))}
        </div>

        <MainChart
          s={activeSeries} data={activeData} meta={activeMeta}
          range={range} onRangeChange={setRange}
        />

        <div style={S.sectionHeader}>
          <span style={S.sectionTitle}>Historical Snapshots (5-Year)</span>
        </div>
        <div style={S.miniGrid}>
          {SERIES.slice(0, 6).map(s =>
            seriesData[s.id]?.length
              ? <MiniChart key={s.id} s={s} data={seriesData[s.id]} meta={seriesMeta[s.id]} />
              : null
          )}
        </div>
      </main>

      <footer style={S.footer}>
        <div style={S.footerText}>
          Clever Macro · Data from FRED® API, Federal Reserve Bank of St. Louis · Auto-refreshes every 5 min
          {lastRefresh && ` · Dashboard last refreshed ${lastRefresh.toLocaleString()}`}
        </div>
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  header: {
    background: '#fff', borderBottom: '1px solid var(--border)',
    padding: '0 32px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', height: 52,
    position: 'sticky', top: 0, zIndex: 100,
  },
  logo: { fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' },
  headerDivider: { width: 1, height: 18, background: 'var(--border)' },
  headerSub: { fontSize: 12, color: 'var(--text-secondary)' },
  lastUpdated: { fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-tertiary)' },
  refreshBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 12px', background: BLUE, color: 'white',
    border: 'none', borderRadius: 4, fontFamily: 'var(--sans)',
    fontSize: 12, fontWeight: 500,
  },
  statusBar: {
    background: '#fff', borderBottom: '1px solid var(--border-light)',
    padding: '0 32px', height: 34, display: 'flex',
    alignItems: 'center', overflowX: 'auto',
  },
  statusSep: { width: 1, height: 14, background: 'var(--border-light)', marginRight: 16 },
  statusLabel: { fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  statusValue: { fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 500, color: 'var(--text-primary)' },
  main: { padding: '24px 32px', maxWidth: 1400, margin: '0 auto' },
  errorBox: {
    background: '#fdf3f2', border: '1px solid #f5c6c3', borderRadius: 4,
    padding: '10px 14px', fontSize: 12, color: 'var(--negative)', marginBottom: 16,
  },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: BLUE },
  cardsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 1, background: 'var(--border)',
    border: '1px solid var(--border)', borderRadius: 6,
    overflow: 'hidden', marginBottom: 24,
  },
  card: { background: '#fff', padding: '16px 18px', transition: 'background 0.15s', borderBottom: '2px solid transparent' },
  cardLabel: { fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: 8 },
  cardValue: { fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1 },
  metaRow: { display: 'flex', alignItems: 'baseline', gap: 5 },
  metaKey: { fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', flexShrink: 0 },
  metaVal: { fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-secondary)' },
  cardSource: { fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.04em' },
  skeleton: { background: 'var(--border-light)', borderRadius: 3, color: 'transparent', animation: 'pulse 1.4s ease-in-out infinite' },
  badge: { fontFamily: 'var(--mono)', fontSize: 10, padding: '1px 5px', borderRadius: 2, display: 'inline-block' },
  chartPanel: {
    background: '#fff', border: '1px solid var(--border)',
    borderRadius: 6, overflow: 'hidden', marginBottom: 24,
  },
  chartPlaceholder: { height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  chartHeader: {
    padding: '16px 20px', borderBottom: '1px solid var(--border-light)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
  },
  chartTitle: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 0 },
  chartSubtitle: { fontSize: 11, color: 'var(--text-secondary)' },
  statLabel: { fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 },
  statValue: { fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' },
  rangeTab: {
    fontFamily: 'var(--mono)', fontSize: 11, padding: '3px 8px',
    border: '1px solid var(--border)', background: 'transparent',
    color: 'var(--text-secondary)', borderRadius: 3,
  },
  rangeTabActive: {
    fontFamily: 'var(--mono)', fontSize: 11, padding: '3px 8px',
    border: `1px solid ${BLUE}`, background: BLUE,
    color: 'white', borderRadius: 3,
  },
  chartFooter: {
    padding: '10px 20px', borderTop: '1px solid var(--border-light)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  chartFooterText: { fontSize: 10, color: 'var(--text-tertiary)' },
  miniGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 },
  miniPanel: { background: '#fff', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' },
  miniHeader: {
    padding: '14px 16px 10px', borderBottom: '1px solid var(--border-light)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  miniTitle: { fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 1 },
  miniValue: { fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, marginBottom: 2 },
  footer: { padding: '0 32px 24px', maxWidth: 1400, margin: '0 auto' },
  footerText: { fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-tertiary)' },
};
