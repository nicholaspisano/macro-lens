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

// ─── Skeleton card ───────────────────────────────────────────────────────────
function SkeletonCard({ s }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardLabel}>{s.label}</div>
      <div style={{ ...styles.cardValue, ...styles.skeleton }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
        <span style={{ ...styles.badge, background: '#ebebea', color: 'transparent', borderRadius: 2 }}>──</span>
        <span style={styles.cardDate}>Loading…</span>
      </div>
      <div style={styles.cardSource}>FRED · {s.freq}</div>
    </div>
  );
}

// ─── Metric card ─────────────────────────────────────────────────────────────
function MetricCard({ s, data, active, onClick }) {
  if (!data || !data.length) return <SkeletonCard s={s} />;
  const latest = data[data.length - 1];
  const prev   = data[data.length - 2];
  const chg    = prev ? latest.value - prev.value : null;
  const { text, cls } = formatChange(chg, s.format);

  const cardStyle = active
    ? { ...styles.card, background: 'var(--accent)', cursor: 'pointer' }
    : { ...styles.card, cursor: 'pointer' };

  const badgeStyle = active
    ? { ...styles.badge, ...(cls === 'pos' ? styles.badgePosInv : cls === 'neg' ? styles.badgeNegInv : styles.badgeNeu) }
    : { ...styles.badge, ...(cls === 'pos' ? styles.badgePos : cls === 'neg' ? styles.badgeNeg : styles.badgeNeu) };

  return (
    <div style={cardStyle} onClick={onClick}>
      <div style={{ ...styles.cardLabel, color: active ? 'rgba(255,255,255,0.5)' : undefined }}>{s.label}</div>
      <div style={{ ...styles.cardValue, color: active ? '#fff' : undefined }}>{formatValue(latest.value, s.format)}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
        <span style={badgeStyle}>{text}</span>
        <span style={{ ...styles.cardDate, color: active ? 'rgba(255,255,255,0.4)' : undefined }}>{dateLabel(latest.date)}</span>
      </div>
      <div style={{ ...styles.cardSource, color: active ? 'rgba(255,255,255,0.3)' : undefined }}>FRED · {s.freq}</div>
    </div>
  );
}

// ─── Mini sparkline ───────────────────────────────────────────────────────────
function MiniChart({ s, data }) {
  const filtered = filterRange(data, '5Y');
  if (!filtered.length) return null;

  const latest = data[data.length - 1];
  const prev   = data[data.length - 2];
  const chg    = prev ? latest.value - prev.value : null;
  const { text, cls } = formatChange(chg, s.format);

  const badgeStyle = { ...styles.badge, ...(cls === 'pos' ? styles.badgePos : cls === 'neg' ? styles.badgeNeg : styles.badgeNeu) };

  const chartData = {
    labels: filtered.map(d => d.date),
    datasets: [{
      data: filtered.map(d => d.value),
      borderColor: '#1a1a18',
      borderWidth: 1.5,
      backgroundColor: (ctx) => {
        if (!ctx.chart.chartArea) return 'transparent';
        const { top, bottom } = ctx.chart.chartArea;
        const g = ctx.chart.ctx.createLinearGradient(0, top, 0, bottom);
        g.addColorStop(0, 'rgba(26,26,24,0.08)');
        g.addColorStop(1, 'rgba(26,26,24,0.00)');
        return g;
      },
      fill: true,
      tension: 0.3,
      pointRadius: 0,
    }],
  };

  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
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
    <div style={styles.miniPanel}>
      <div style={styles.miniHeader}>
        <div>
          <div style={styles.miniTitle}>{s.label}</div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{s.freq} · 5Y</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={styles.miniValue}>{formatValue(latest.value, s.format)}</div>
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
function MainChart({ s, data, range, onRangeChange }) {
  if (!s || !data) {
    return (
      <div style={styles.chartPanel}>
        <div style={styles.chartPlaceholder}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>
            SELECT AN INDICATOR TO VIEW CHART
          </span>
        </div>
      </div>
    );
  }

  const filtered = filterRange(data, range);
  const vals     = filtered.map(d => d.value);
  const latest   = vals[vals.length - 1];
  const min      = Math.min(...vals);
  const max      = Math.max(...vals);
  const avg      = vals.reduce((a, b) => a + b, 0) / vals.length;

  const chartData = {
    labels: filtered.map(d => d.date),
    datasets: [{
      data: vals,
      borderColor: '#1a1a18',
      borderWidth: 1.5,
      backgroundColor: (ctx) => {
        if (!ctx.chart.chartArea) return 'transparent';
        const { top, bottom } = ctx.chart.chartArea;
        const g = ctx.chart.ctx.createLinearGradient(0, top, 0, bottom);
        g.addColorStop(0, 'rgba(26,26,24,0.08)');
        g.addColorStop(1, 'rgba(26,26,24,0.00)');
        return g;
      },
      fill: true,
      tension: 0.3,
      pointRadius: 0,
      pointHoverRadius: 4,
      pointHoverBackgroundColor: '#1a1a18',
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2,
    }],
  };

  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1a18',
        titleColor: 'rgba(255,255,255,0.5)',
        bodyColor: '#fff',
        titleFont: { family: "'IBM Plex Mono'", size: 10 },
        bodyFont: { family: "'IBM Plex Mono'", size: 12, weight: '500' },
        padding: 10,
        cornerRadius: 4,
        displayColors: false,
        callbacks: {
          title: items => dateLabel(items[0].label),
          label: item => formatValue(item.raw, s.format),
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          font: { family: "'IBM Plex Mono'", size: 10 },
          color: '#a0a09d',
          maxTicksLimit: 8,
          maxRotation: 0,
          callback: (_, i, ticks) => {
            const lbl = filtered[i]?.date;
            if (!lbl) return '';
            return new Date(lbl + 'T00:00:00').getFullYear();
          }
        }
      },
      y: {
        grid: { color: '#ebebea' },
        border: { display: false },
        ticks: {
          font: { family: "'IBM Plex Mono'", size: 10 },
          color: '#a0a09d',
          maxTicksLimit: 6,
          callback: v => formatValue(v, s.format)
        }
      }
    }
  };

  const ranges = ['1Y', '5Y', '10Y', 'MAX'];

  return (
    <div style={styles.chartPanel}>
      {/* header */}
      <div style={styles.chartHeader}>
        <div style={{ flex: 1 }}>
          <div style={styles.chartTitle}>{s.title}</div>
          <div style={styles.chartSubtitle}>{s.subtitle}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24 }}>
          {/* stats */}
          {[['Current', latest], ['High', max], ['Low', min], ['Avg', avg]].map(([lbl, val]) => (
            <div key={lbl} style={{ textAlign: 'right' }}>
              <div style={styles.statLabel}>{lbl}</div>
              <div style={styles.statValue}>{formatValue(val, s.format)}</div>
            </div>
          ))}
          {/* range tabs */}
          <div style={{ display: 'flex', gap: 2 }}>
            {ranges.map(r => (
              <button
                key={r}
                onClick={() => onRangeChange(r)}
                style={r === range ? styles.rangeTabActive : styles.rangeTab}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* chart */}
      <div style={{ height: 280, padding: '16px 20px 12px' }}>
        <Line data={chartData} options={opts} />
      </div>
      {/* footer */}
      <div style={styles.chartFooter}>
        <span style={styles.chartFooterText}>Source: Federal Reserve Bank of St. Louis (FRED)</span>
        <span style={styles.chartFooterText}>{s.freq} frequency</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [seriesData, setSeriesData]   = useState({});
  const [activeId, setActiveId]       = useState(null);
  const [range, setRange]             = useState('5Y');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const timerRef = useRef(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        SERIES.map(async s => {
          const params = new URLSearchParams({ seriesId: s.id, yoyCalc: s.yoyCalc ? 'true' : 'false' });
          const res = await fetch(`/api/fred?${params}`);
          if (!res.ok) {
            const e = await res.json();
            throw new Error(e.error || `HTTP ${res.status}`);
          }
          const { observations } = await res.json();
          return [s.id, observations];
        })
      );
      setSeriesData(Object.fromEntries(results));
      setLastUpdated(new Date());
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

  return (
    <>
      <Head>
        <title>MacroLens — U.S. Economic Dashboard</title>
        <meta name="description" content="Live U.S. macroeconomic indicators from FRED" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📊</text></svg>" />
      </Head>

      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={styles.logo}>MACRO<span style={{ color: 'var(--text-tertiary)' }}>/</span>LENS</div>
          <div style={styles.headerDivider} />
          <div style={styles.headerSub}>U.S. Economic Indicators — Federal Reserve Bank of St. Louis</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {lastUpdated && (
            <span style={styles.lastUpdated}>
              Updated {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button
            style={loading ? { ...styles.refreshBtn, opacity: 0.5 } : styles.refreshBtn}
            onClick={loadAll}
            disabled={loading}
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
      <div style={styles.statusBar}>
        {SERIES.map((s, i) => {
          const d = seriesData[s.id];
          if (!d?.length) return null;
          const latest = d[d.length - 1];
          const prev   = d[d.length - 2];
          const chg    = prev ? latest.value - prev.value : null;
          const { text, cls } = formatChange(chg, s.format);
          const badgeStyle = { ...styles.badge, ...(cls === 'pos' ? styles.badgePos : cls === 'neg' ? styles.badgeNeg : styles.badgeNeu) };
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
              {i > 0 && <div style={styles.statusSep} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={styles.statusLabel}>{s.label}</span>
                <span style={styles.statusValue}>{formatValue(latest.value, s.format)}</span>
                <span style={badgeStyle}>{text}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main ── */}
      <main style={styles.main}>
        {error && <div style={styles.errorBox}>⚠ {error}</div>}

        {/* Section header */}
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>Key Indicators</span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Click a card to explore</span>
        </div>

        {/* Cards */}
        <div style={styles.cardsGrid}>
          {SERIES.map(s => (
            <MetricCard
              key={s.id}
              s={s}
              data={seriesData[s.id]}
              active={activeId === s.id}
              onClick={() => setActiveId(s.id)}
            />
          ))}
        </div>

        {/* Main chart */}
        <MainChart
          s={activeSeries}
          data={activeData}
          range={range}
          onRangeChange={setRange}
        />

        {/* Mini charts */}
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>Historical Snapshots (5-Year)</span>
        </div>
        <div style={styles.miniGrid}>
          {SERIES.slice(0, 4).map(s => (
            seriesData[s.id]?.length
              ? <MiniChart key={s.id} s={s} data={seriesData[s.id]} />
              : null
          ))}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={styles.footer}>
        <div style={styles.footerText}>
          Data sourced from FRED® API — Federal Reserve Bank of St. Louis.
          Auto-refreshes every 5 minutes. {lastUpdated && `Last refresh: ${lastUpdated.toLocaleString()}`}
        </div>
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  header: {
    background: 'var(--surface)', borderBottom: '1px solid var(--border)',
    padding: '0 32px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', height: 52,
    position: 'sticky', top: 0, zIndex: 100,
  },
  logo: { fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' },
  headerDivider: { width: 1, height: 18, background: 'var(--border)' },
  headerSub: { fontSize: 12, color: 'var(--text-secondary)' },
  lastUpdated: { fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-tertiary)' },
  refreshBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 12px', background: 'var(--accent)', color: 'white',
    border: 'none', borderRadius: 4, fontFamily: 'var(--sans)',
    fontSize: 12, fontWeight: 500, cursor: 'pointer',
  },
  statusBar: {
    background: 'var(--surface)', borderBottom: '1px solid var(--border-light)',
    padding: '0 32px', height: 34, display: 'flex',
    alignItems: 'center', gap: 0, overflowX: 'auto',
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
  sectionTitle: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' },
  cardsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 1, background: 'var(--border)',
    border: '1px solid var(--border)', borderRadius: 6,
    overflow: 'hidden', marginBottom: 24,
  },
  card: { background: 'var(--surface)', padding: '18px 20px', transition: 'background 0.1s' },
  cardLabel: { fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: 10 },
  cardValue: { fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1 },
  cardDate: { fontSize: 10, color: 'var(--text-tertiary)' },
  cardSource: { fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.04em' },
  skeleton: { background: 'var(--border-light)', borderRadius: 3, color: 'transparent', animation: 'pulse 1.4s ease-in-out infinite' },
  badge: { fontFamily: 'var(--mono)', fontSize: 10, padding: '1px 5px', borderRadius: 2, display: 'inline-block' },
  badgePos: { color: '#2a7d4f', background: '#f0faf5' },
  badgeNeg: { color: '#c0392b', background: '#fdf3f2' },
  badgeNeu: { color: 'var(--text-tertiary)', background: 'transparent' },
  badgePosInv: { color: '#6ee9a8', background: 'rgba(110,233,168,0.12)' },
  badgeNegInv: { color: '#f88', background: 'rgba(255,136,136,0.12)' },
  chartPanel: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 6, overflow: 'hidden', marginBottom: 24,
  },
  chartPlaceholder: {
    height: 380, display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'var(--surface)',
  },
  chartHeader: {
    padding: '16px 20px', borderBottom: '1px solid var(--border-light)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
  },
  chartTitle: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 },
  chartSubtitle: { fontSize: 11, color: 'var(--text-secondary)' },
  statLabel: { fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 },
  statValue: { fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' },
  rangeTab: {
    fontFamily: 'var(--mono)', fontSize: 11, padding: '3px 8px',
    border: '1px solid var(--border)', background: 'transparent',
    color: 'var(--text-secondary)', borderRadius: 3, transition: 'all 0.1s',
  },
  rangeTabActive: {
    fontFamily: 'var(--mono)', fontSize: 11, padding: '3px 8px',
    border: '1px solid var(--accent)', background: 'var(--accent)',
    color: 'white', borderRadius: 3,
  },
  chartFooter: {
    padding: '10px 20px', borderTop: '1px solid var(--border-light)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  chartFooterText: { fontSize: 10, color: 'var(--text-tertiary)' },
  miniGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 },
  miniPanel: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' },
  miniHeader: {
    padding: '14px 16px 10px', borderBottom: '1px solid var(--border-light)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  miniTitle: { fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 1 },
  miniValue: { fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, marginBottom: 2 },
  footer: { padding: '0 32px 24px', maxWidth: 1400, margin: '0 auto' },
  footerText: { fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-tertiary)' },
};
