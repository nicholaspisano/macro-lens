import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Filler, Tooltip, Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { SERIES, GROUPS, formatValue, formatChange, dateLabel, filterRange } from '../lib/series';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const REFRESH_MS = 5 * 60 * 1000;
const BLUE = '#44B2EF';

function fmtReleaseDate(str) {
  if (!str) return null;
  // Plain date "2026-01-31" — parse directly without Date constructor to avoid UTC shift
  const plainDate = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (plainDate) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parseInt(plainDate[2]) - 1]} ${parseInt(plainDate[3])}, ${plainDate[1]}`;
  }
  // FRED datetime "2026-02-13 08:05:50-06" — fix space and short tz offset
  const normalized = str.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00');
  const d = new Date(normalized);
  if (isNaN(d)) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard({ s }) {
  return (
    <div style={S.card}>
      <div style={S.cardLabel}>{s.label}</div>
      <div style={{ ...S.cardValue, ...S.skeleton }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
      <div style={{ marginTop: 8 }}>
        <div style={{ ...S.metaRow, marginBottom: 3 }}>
          <span style={S.metaKey}>Measures</span>
          <span style={{ ...S.metaVal, color: '#ccc' }}>—</span>
        </div>
        <div style={S.metaRow}>
          <span style={S.metaKey}>Released</span>
          <span style={{ ...S.metaVal, color: '#ccc' }}>—</span>
        </div>
      </div>
      <div style={S.cardSource}>FRED · {s.freq}</div>
    </div>
  );
}

// ─── Metric card ──────────────────────────────────────────────────────────────
function MetricCard({ s, data, meta, active, onClick }) {
  const [hovered, setHovered] = useState(false);
  const [tipVisible, setTipVisible] = useState(false);

  if (!data || !data.length) return <SkeletonCard s={s} />;

  const latest = data[data.length - 1];
  const prev   = data[data.length - 2];
  const chg    = prev ? latest.value - prev.value : null;
  const { text, cls } = formatChange(chg, s.format);
  const isPos = cls === 'pos', isNeg = cls === 'neg';
  const released = fmtReleaseDate(s.source === 'zillow' ? meta?.latestObsDate : meta?.lastUpdated);

  const isRecent = (() => {
    const dateStr = meta?.lastUpdated || meta?.latestObsDate;
    if (!dateStr) return false;
    const updated = new Date(dateStr.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'));
    if (isNaN(updated)) return false;
    const hoursSince = (Date.now() - updated.getTime()) / (1000 * 60 * 60);
    const threshold = (s.freq === 'Weekly' || s.freq === 'Daily') ? 24 : 72;
    return hoursSince <= threshold;
  })();

  const cardStyle = active
    ? { ...S.card, background: '#0f1c26', borderBottom: `2px solid ${BLUE}`, cursor: 'pointer' }
    : { ...S.card, cursor: 'pointer', borderBottom: '2px solid transparent' };

  const badgeStyle = active
    ? { ...S.badge, color: isPos ? '#6ee9a8' : isNeg ? '#f88' : 'rgba(255,255,255,0.4)', background: isPos ? 'rgba(110,233,168,0.12)' : isNeg ? 'rgba(255,136,136,0.12)' : 'transparent' }
    : { ...S.badge, color: isPos ? '#2a7d4f' : isNeg ? '#c0392b' : 'var(--text-tertiary)', background: isPos ? '#f0faf5' : isNeg ? '#fdf3f2' : 'transparent' };

  const dim    = active ? 'rgba(255,255,255,0.35)' : 'var(--text-tertiary)';
  const bright = active ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)';

  const hoverStyle = (!active && hovered) ? { ...cardStyle, background: '#f5fbff' } : cardStyle;

  return (
    <div style={hoverStyle} onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ ...S.cardLabel, marginBottom: 0, color: active ? 'rgba(68,178,239,0.7)' : undefined }}>{s.label}</div>
          {isRecent && (
            <span style={{
              fontSize: 9, fontFamily: 'var(--mono)', fontWeight: 700,
              letterSpacing: '0.05em', textTransform: 'uppercase',
              background: active ? 'rgba(110,233,168,0.2)' : '#edfaf3',
              color: active ? '#6ee9a8' : '#2a7d4f',
              padding: '1px 5px', borderRadius: 3,
            }}>New</span>
          )}
        </div>
        {s.description && (
          <div style={{ position: 'relative', flexShrink: 0, marginLeft: 6 }}
            onMouseEnter={e => { e.stopPropagation(); setTipVisible(true); }}
            onMouseLeave={() => setTipVisible(false)}
            onClick={e => e.stopPropagation()}
          >
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 15, height: 15, borderRadius: '50%',
              background: active ? 'rgba(255,255,255,0.25)' : BLUE,
              color: 'white', fontSize: 10, fontFamily: 'var(--mono)',
              fontWeight: 700, cursor: 'default', userSelect: 'none', flexShrink: 0,
            }}>i</span>
            {tipVisible && (
              <div style={{
                position: 'absolute', bottom: '130%', right: -8,
                background: '#0f1c26', color: 'rgba(255,255,255,0.88)',
                fontSize: 12, lineHeight: 1.5, padding: '10px 12px',
                borderRadius: 5, width: 260, zIndex: 9999,
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                pointerEvents: 'none',
              }}>
                {s.description}
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ ...S.cardValue, color: active ? '#fff' : undefined }}>
        {formatValue(latest.value, s.format)}
      </div>
      <span style={{ ...badgeStyle, marginTop: 6, marginBottom: 10, display: 'inline-block' }}>{text}</span>
      <div>
        <div style={{ ...S.metaRow, marginBottom: 3 }}>
          <span style={{ ...S.metaKey, color: dim }}>Measures</span>
          <span style={{ ...S.metaVal, color: bright }}>{dateLabel(latest.date, s.dateFormat)}</span>
        </div>
        <div style={S.metaRow}>
          <span style={{ ...S.metaKey, color: dim }}>Released</span>
          <span style={{ ...S.metaVal, color: bright }}>{released ?? '—'}</span>
        </div>
      </div>
      <div style={{ ...S.cardSource, color: active ? 'rgba(255,255,255,0.2)' : undefined }}>{s.source === 'zillow' ? 'Zillow' : 'FRED'} · {s.freq}</div>
    </div>
  );
}

// ─── Section chart ────────────────────────────────────────────────────────────
function SectionChart({ s, data, meta, range, onRangeChange }) {
  if (!s || !data) return null;

  const filtered = filterRange(data, range);
  const vals     = filtered.map(d => d.value);
  const latest   = vals[vals.length - 1];
  const min      = Math.min(...vals);
  const max      = Math.max(...vals);
  const avg      = vals.reduce((a, b) => a + b, 0) / vals.length;
  const latestObs = data[data.length - 1];
  const released  = fmtReleaseDate(meta?.lastUpdated);

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
        titleColor: 'rgba(68,178,239,0.7)',
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
        title: {
          display: true,
          text: s.unit,
          font: { family: "'IBM Plex Mono'", size: 9 },
          color: '#a0a09d',
          padding: { bottom: 4 },
        },
        ticks: {
          font: { family: "'IBM Plex Mono'", size: 10 }, color: '#a0a09d',
          maxTicksLimit: 6, callback: v => formatValue(v, s.format)
        }
      }
    }
  };

  const ranges = ['3M', '1Y', '5Y', '10Y', 'MAX'];

  return (
    <div style={S.chartPanel}>
      <div style={S.chartHeader}>
        <div style={{ flex: 1 }}>
          <div style={S.chartTitle}>{s.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={S.chartSubtitle}>{s.subtitle}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: BLUE }}>
              Measures {dateLabel(latestObs.date)}
              {released && ` · Released ${released}`}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, flexShrink: 0 }}>
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
      <div style={{ height: 260, padding: '16px 20px 12px' }}>
        <Line data={chartData} options={opts} />
      </div>
      <div style={S.chartFooter}>
        <a
          href={s.source === 'zillow'
            ? 'https://www.zillow.com/research/data/'
            : `https://fred.stlouisfed.org/series/${s.id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...S.chartFooterText, color: BLUE, textDecoration: 'none' }}
          onMouseEnter={e => e.target.style.textDecoration = 'underline'}
          onMouseLeave={e => e.target.style.textDecoration = 'none'}
        >
          {s.source === 'zillow'
            ? 'Source: Zillow Research ↗'
            : 'Source: Federal Reserve Bank of St. Louis (FRED) ↗'}
        </a>
        <span style={S.chartFooterText}>{s.freq} frequency</span>
      </div>
    </div>
  );
}

// ─── Card section with its own chart ─────────────────────────────────────────
function CardSection({ group, series, seriesData, seriesMeta }) {
  const [activeId, setActiveId] = useState(null);
  const [range, setRange]       = useState('5Y');
  const chartRef                = useRef(null);

  const activeSeries = series.find(s => s.id === activeId);
  const activeData   = activeId ? seriesData[activeId] : null;
  const activeMeta   = activeId ? seriesMeta[activeId] : null;

  const handleSelect = (id) => {
    if (activeId === id) {
      setActiveId(null); // toggle off
    } else {
      setActiveId(id);
      // Scroll chart into view smoothly after render
      setTimeout(() => chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    }
  };

  const cols = series.length;

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={S.sectionHeader}>
        <span style={S.sectionTitle}>{group.label}</span>
        <span style={{ fontSize: 14, color: 'var(--text-tertiary)', fontWeight: 600 }}>
          {activeId ? 'Click selected card to collapse' : 'Click a card to explore'}
        </span>
      </div>

      {/* Cards — support multi-row layout via s.row property */}
      {(() => {
        const hasRows = series.some(s => s.row);
        if (!hasRows) {
          return (
            <div style={{ ...S.cardsGrid, gridTemplateColumns: `repeat(${cols}, 1fr)`, borderRadius: activeId ? '6px 6px 0 0' : 6 }}>
              {series.map(s => (
                <MetricCard key={s.id} s={s} data={seriesData[s.id]} meta={seriesMeta[s.id]} active={activeId === s.id} onClick={() => handleSelect(s.id)} />
              ))}
            </div>
          );
        }
        const rowNums = [...new Set(series.map(s => s.row || 1))].sort();
        return (
          <div style={{ borderRadius: activeId ? '6px 6px 0 0' : 6, overflow: 'visible', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--border)' }}>
            {rowNums.map(rowNum => {
              const rowSeries = series.filter(s => (s.row || 1) === rowNum);
              return (
                <div key={rowNum} style={{ display: 'grid', gridTemplateColumns: `repeat(${rowSeries.length}, 1fr)`, gap: 1, background: 'var(--border)' }}>
                  {rowSeries.map(s => (
                    <MetricCard key={s.id} s={s} data={seriesData[s.id]} meta={seriesMeta[s.id]} active={activeId === s.id} onClick={() => handleSelect(s.id)} />
                  ))}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Inline chart — only shown when a card is selected */}
      {activeId && (
        <div ref={chartRef} style={{ border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>
          <SectionChart
            s={activeSeries}
            data={activeData}
            meta={activeMeta}
            range={range}
            onRangeChange={setRange}
          />
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [seriesData, setSeriesData]   = useState({});
  const [seriesMeta, setSeriesMeta]   = useState({});
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const timerRef = useRef(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Stagger requests in batches of 4 to avoid FRED rate limiting (429)
      const BATCH_SIZE = 6;
      const BATCH_DELAY = 300; // ms between batches
      const allResults = [];

      for (let i = 0; i < SERIES.length; i += BATCH_SIZE) {
        const batch = SERIES.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(async s => {
            let url;
            if (s.source === 'zillow') {
              url = `/api/zillow?metric=${s.id}`;
            } else {
              const params = new URLSearchParams({ seriesId: s.id, yoyCalc: s.yoyCalc ? 'true' : 'false' });
              url = `/api/fred?${params}`;
            }
            const res = await fetch(url);
            if (!res.ok) { const e = await res.json(); throw new Error(e.error || `HTTP ${res.status}`); }
            const { observations, lastUpdated, latestObsDate } = await res.json();
            return [s.id, { observations, lastUpdated, latestObsDate }];
          })
        );
        allResults.push(...batchResults);
        if (i + BATCH_SIZE < SERIES.length) {
          await new Promise(r => setTimeout(r, BATCH_DELAY));
        }
      }
      const results = allResults;
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
            <span style={{ color: 'white' }}>CLEVER</span>
            <span style={{ color: 'rgba(255,255,255,0.45)', margin: '0 1px' }}>/</span>
            <span style={{ color: 'white' }}>MACRO</span>
          </div>
          <div style={S.headerDivider} />
          <div style={S.headerSub}>Economic, Real Estate, and Personal Finance Data Dashboard</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button style={loading ? { ...S.refreshBtn, opacity: 0.5 } : S.refreshBtn} onClick={loadAll} disabled={loading}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}>
              <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={S.main}>
        {error && <div style={S.errorBox}>⚠ {error}</div>}

        {GROUPS.map(group => {
          const groupSeries = SERIES.filter(s => s.group === group.key);
          if (!groupSeries.length) return null;
          return (
            <CardSection
              key={group.key}
              group={group}
              series={groupSeries}
              seriesData={seriesData}
              seriesMeta={seriesMeta}
            />
          );
        })}
      </main>

      <footer style={S.footer}>
        <div style={S.footerText}>
          Clever Macro · Data from FRED® API, Federal Reserve Bank of St. Louis · Auto-refreshes every 5 min
          {lastRefresh && ` · Last refreshed ${lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
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
    background: BLUE, borderBottom: 'none',
    padding: '0 32px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', height: 52,
    position: 'sticky', top: 0, zIndex: 100,
  },
  logo: { fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' },
  headerDivider: { width: 1, height: 18, background: 'rgba(255,255,255,0.35)' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  lastUpdated: { fontFamily: 'var(--mono)', fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  refreshBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 12px', background: 'rgba(255,255,255,0.2)', color: 'white',
    border: '1px solid rgba(255,255,255,0.4)', borderRadius: 4,
    fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500,
  },
  statusBar: {
    background: '#fff', borderBottom: '1px solid var(--border-light)',
    padding: '0 32px', height: 34, display: 'flex',
    alignItems: 'center', overflowX: 'auto',
  },
  statusSep: { width: 1, height: 14, background: 'var(--border-light)', marginRight: 16 },
  statusLabel: { fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  statusValue: { fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' },
  main: { padding: '24px 32px', maxWidth: 1400, margin: '0 auto' },
  errorBox: {
    background: '#fdf3f2', border: '1px solid #f5c6c3', borderRadius: 4,
    padding: '10px 14px', fontSize: 12, color: 'var(--negative)', marginBottom: 16,
  },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: BLUE },
  cardsGrid: {
    display: 'grid',
    gap: 1, background: 'var(--border)',
    border: '1px solid var(--border)',
    overflow: 'visible',
  },
  card: { background: '#fff', padding: '16px 18px', transition: 'background 0.15s', borderBottom: '2px solid transparent' },
  cardLabel: { fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: 8 },
  cardValue: { fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1 },
  metaRow: { display: 'flex', alignItems: 'baseline', gap: 5 },
  metaKey: { fontFamily: 'var(--mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', flexShrink: 0 },
  metaVal: { fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-secondary)' },
  cardSource: { fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.04em' },
  skeleton: { background: 'var(--border-light)', borderRadius: 3, color: 'transparent', animation: 'pulse 1.4s ease-in-out infinite' },
  badge: { fontFamily: 'var(--mono)', fontSize: 12, padding: '1px 5px', borderRadius: 2, display: 'inline-block' },
  chartPanel: { background: '#fff' },
  chartHeader: {
    padding: '16px 20px', borderBottom: '1px solid var(--border-light)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
  },
  chartTitle: { fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' },
  chartSubtitle: { fontSize: 13, color: 'var(--text-secondary)' },
  statLabel: { fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 },
  statValue: { fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' },
  rangeTab: {
    fontFamily: 'var(--mono)', fontSize: 13, padding: '3px 8px',
    border: '1px solid var(--border)', background: 'transparent',
    color: 'var(--text-secondary)', borderRadius: 3,
  },
  rangeTabActive: {
    fontFamily: 'var(--mono)', fontSize: 13, padding: '3px 8px',
    border: `1px solid ${BLUE}`, background: BLUE,
    color: 'white', borderRadius: 3,
  },
  chartFooter: {
    padding: '10px 20px', borderTop: '1px solid var(--border-light)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  chartFooterText: { fontSize: 12, color: 'var(--text-tertiary)' },
  footer: { padding: '0 32px 24px', maxWidth: 1400, margin: '0 auto' },
  footerText: { fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-tertiary)' },
};
