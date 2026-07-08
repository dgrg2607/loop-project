import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import SentimentTrendChart from '../components/SentimentTrendChart';
import ThemeBarChart from '../components/ThemeBarChart';
import ChannelPieChart from '../components/ChannelPieChart';

// ── Small helpers ──────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function SentimentBar({ positive = 0, neutral = 0, negative = 0 }) {
  const total = positive + neutral + negative || 1;
  const pPct = Math.round((positive / total) * 100);
  const nuPct = Math.round((neutral / total) * 100);
  const nePct = 100 - pPct - nuPct;
  return (
    <div className="sentiment-bar-wrap">
      <div className="sentiment-bar">
        <div className="sb-seg sb-pos" style={{ width: `${pPct}%` }} title={`Positive ${pPct}%`} />
        <div className="sb-seg sb-neu" style={{ width: `${nuPct}%` }} title={`Neutral ${nuPct}%`} />
        <div className="sb-seg sb-neg" style={{ width: `${nePct}%` }} title={`Negative ${nePct}%`} />
      </div>
      <div className="sentiment-bar-legend">
        <span><i className="dot-inline pos" />{pPct}% positive</span>
        <span><i className="dot-inline neu" />{nuPct}% neutral</span>
        <span><i className="dot-inline neg" />{nePct}% negative</span>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, icon, color, trend, trendDir }) {
  return (
    <div className="metric-card" style={{ '--mc': color }}>
      <div className="mc-top">
        <div className="mc-icon-wrap">{icon}</div>
        {trend !== undefined && (
          <div className={`mc-trend ${trendDir === 'up' ? 'up' : trendDir === 'down' ? 'down' : 'flat'}`}>
            {trendDir === 'up' ? '↑' : trendDir === 'down' ? '↓' : '→'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mc-value">{value}</div>
      <div className="mc-label">{label}</div>
      {sub && <div className="mc-sub">{sub}</div>}
    </div>
  );
}

const SENTIMENT_ICONS = {
  positive: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3"/><line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3"/></svg>,
  neutral: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="15" x2="16" y2="15"/><line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3"/><line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3"/></svg>,
  negative: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3"/><line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3"/></svg>,
};

const CHANNEL_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const TOTAL_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;

function RecentFeedback({ items }) {
  const COLORS = { positive: '#2D6A4F', neutral: '#C98A2C', negative: '#C1432D' };
  if (!items.length) return <p className="empty-state">No feedback yet.</p>;
  return (
    <ul className="recent-list">
      {items.map((f) => (
        <li key={f._id} className="recent-item">
          <div className="recent-dot" style={{ background: COLORS[f.sentiment.label] }} />
          <div className="recent-body">
            <p className="recent-text">{f.text.length > 120 ? f.text.slice(0, 120) + '…' : f.text}</p>
            <div className="recent-meta">
              <span className="recent-name">{f.customerName}</span>
              <span className="recent-channel">{f.channel.replace('_', ' ')}</span>
              <span className="recent-date">{new Date(f.createdAt).toLocaleDateString('en', { month:'short', day:'numeric' })}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function TrendBadge({ changePercent }) {
  if (changePercent > 0) return <span className="trend-badge up">↑ {changePercent}%</span>;
  if (changePercent < 0) return <span className="trend-badge down">↓ {Math.abs(changePercent)}%</span>;
  return <span className="trend-badge flat">→ 0%</span>;
}

function QuickAction({ to, icon, label, desc }) {
  return (
    <Link to={to} className="quick-action">
      <div className="qa-icon">{icon}</div>
      <div>
        <div className="qa-label">{label}</div>
        <div className="qa-desc">{desc}</div>
      </div>
    </Link>
  );
}

// ── Main dashboard component ───────────────────────────────────────────────────
export default function Dashboard() {
  const { user, organization } = useAuth();
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState([]);
  const [themes, setThemes] = useState([]);
  const [channels, setChannels] = useState([]);
  const [trending, setTrending] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/analytics/sentiment-trend'),
      api.get('/analytics/themes'),
      api.get('/analytics/channels'),
      api.get('/analytics/trends'),
      api.get('/feedback', { params: { limit: 5 } }),
    ])
      .then(([o, t, th, c, tr, fb]) => {
        setOverview(o.data);
        setTrend(t.data);
        setThemes(th.data);
        setChannels(c.data);
        setTrending(tr.data);
        setRecent(fb.data.items || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const sb = overview?.sentimentBreakdown || { positive: 0, neutral: 0, negative: 0 };
  const total = overview?.total || 0;
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
  const today = new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dash-greeting-row">
          <div className="skeleton" style={{ height: 28, width: 260, borderRadius: 8, marginBottom: 6 }} />
          <div className="skeleton" style={{ height: 14, width: 180, borderRadius: 6 }} />
        </div>
        <div className="metric-grid">
          {[0,1,2,3].map(i => (
            <div className="metric-card" key={i}>
              <div className="skeleton" style={{ height: 32, width: 32, borderRadius: 8, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 30, width: '50%', borderRadius: 6, marginBottom: 6 }} />
              <div className="skeleton" style={{ height: 12, width: '70%', borderRadius: 4 }} />
            </div>
          ))}
        </div>
        <div className="grid-2">
          {[0,1].map(i => <div className="panel skeleton-panel" key={i} style={{ height: 320 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* ── Header greeting ── */}
      <div className="dash-greeting-row">
        <div>
          <h1 className="dash-greeting">{greeting()}, {user?.name?.split(' ')[0]}. 👋</h1>
          <p className="dash-date">{today} · <span className="org-chip">{organization?.name}</span></p>
        </div>
        <div className="dash-header-actions">
          <Link to="/feedback" className="btn-outline-sm">+ Add feedback</Link>
          <Link to="/ask-ai" className="btn-primary-sm">Ask AI ✦</Link>
        </div>
      </div>

      {/* ── Metric cards ── */}
      <div className="metric-grid">
        <MetricCard
          label="Total feedback"
          value={total.toLocaleString()}
          sub="All time"
          icon={TOTAL_ICON}
          color="#2D6A4F"
        />
        <MetricCard
          label="Positive responses"
          value={`${sb.positive}`}
          sub={`${pct(sb.positive)}% of total`}
          icon={SENTIMENT_ICONS.positive}
          color="#2D6A4F"
          trend={pct(sb.positive)}
          trendDir={pct(sb.positive) > 50 ? 'up' : 'down'}
        />
        <MetricCard
          label="Neutral responses"
          value={`${sb.neutral}`}
          sub={`${pct(sb.neutral)}% of total`}
          icon={SENTIMENT_ICONS.neutral}
          color="#C98A2C"
        />
        <MetricCard
          label="Negative responses"
          value={`${sb.negative}`}
          sub={`${pct(sb.negative)}% of total`}
          icon={SENTIMENT_ICONS.negative}
          color="#C1432D"
          trend={pct(sb.negative)}
          trendDir={pct(sb.negative) > 30 ? 'down' : 'up'}
        />
      </div>

      {/* ── Sentiment distribution bar ── */}
      <div className="panel mb-panel">
        <div className="panel-header">
          <h3>Overall sentiment distribution</h3>
          {overview?.averageRating && (
            <div className="avg-rating">
              {'★'.repeat(Math.round(overview.averageRating))}{'☆'.repeat(5 - Math.round(overview.averageRating))}
              <span>{overview.averageRating} avg rating</span>
            </div>
          )}
        </div>
        <SentimentBar {...sb} />
      </div>

      {/* ── Charts row ── */}
      <div className="grid-2 mb-panel">
        <div className="panel">
          <div className="panel-header">
            <h3>Sentiment trend</h3>
            <span className="panel-meta">Last 30 days</span>
          </div>
          {trend.length === 0
            ? <p className="empty-state">Add more feedback to see trends.</p>
            : <SentimentTrendChart data={trend} />}
        </div>
        <div className="panel">
          <div className="panel-header">
            <h3>Top themes</h3>
            <span className="panel-meta">By volume</span>
          </div>
          {themes.length === 0
            ? <p className="empty-state">No themes detected yet.</p>
            : <ThemeBarChart data={themes} />}
        </div>
      </div>

      {/* ── Bottom row: channels + trending + recent + quick actions ── */}
      <div className="grid-3 mb-panel">

        {/* Channels */}
        <div className="panel">
          <div className="panel-header">
            <h3>By channel</h3>
          </div>
          {channels.length === 0
            ? <p className="empty-state">No data yet.</p>
            : <ChannelPieChart data={channels} />}
        </div>

        {/* Emerging trends */}
        <div className="panel">
          <div className="panel-header">
            <h3>Emerging trends</h3>
            <span className="panel-meta">7-day vs. prior 7</span>
          </div>
          {trending.length === 0 ? (
            <p className="empty-state">Not enough recent data yet.</p>
          ) : (
            <ul className="trend-rows">
              {trending.slice(0, 6).map((t) => (
                <li key={t.theme} className="trend-row">
                  <div className="trend-row-left">
                    <span className="trend-theme">{t.theme}</span>
                    <span className="trend-count">{t.recentCount} this week</span>
                  </div>
                  <TrendBadge changePercent={t.changePercent} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right column: recent + quick actions */}
        <div className="panel-col">
          {/* Quick actions */}
          <div className="panel quick-panel">
            <h3>Quick actions</h3>
            <div className="quick-actions">
              <QuickAction
                to="/feedback"
                label="Browse feedback"
                desc="Filter, search, and manage all entries"
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>}
              />
              <QuickAction
                to="/ask-ai"
                label="Ask the AI"
                desc="Get answers from your feedback data"
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3"/></svg>}
              />
              <QuickAction
                to="/reports"
                label="Generate VoC report"
                desc="One-click executive summary"
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="16 13 12 17 8 13"/><line x1="12" y1="17" x2="12" y2="9"/></svg>}
              />
            </div>
          </div>

          {/* Recent feedback */}
          <div className="panel" style={{ flex: 1 }}>
            <div className="panel-header">
              <h3>Recent feedback</h3>
              <Link to="/feedback" className="panel-link">View all →</Link>
            </div>
            <RecentFeedback items={recent} />
          </div>
        </div>
      </div>
    </div>
  );
}
