import { useState } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

export default function Reports() {
  const toast = useToast();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(30);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai/voc-report', { params: { days } });
      setReport(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const pct = (n) => (report?.stats.total ? Math.round((n / report.stats.total) * 100) : 0);

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: '1.2rem' }}>
        <h1 style={{ fontSize: '1.4rem', marginBottom: 4 }}>VoC Reports</h1>
        <p style={{ color: 'var(--ink-60)', fontSize: '0.88rem' }}>
          One-click Voice-of-Customer executive summaries backed by real feedback data.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          style={{ width: 160 }}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
        <button className="btn-primary" onClick={generate} disabled={loading}>
          {loading ? <><span className="btn-spinner" /> Generating…</> : '▤ Generate report'}
        </button>
        {report && (
          <span style={{ fontSize: '0.78rem', color: 'var(--ink-60)' }}>
            Generated {new Date(report.generatedAt).toLocaleString()}
          </span>
        )}
      </div>

      {!report && !loading && (
        <div className="panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>▤</div>
          <h3 style={{ marginBottom: 6 }}>No report yet</h3>
          <p style={{ color: 'var(--ink-60)', fontSize: '0.88rem' }}>
            Select a time window and click "Generate report" to create your VoC summary.
          </p>
        </div>
      )}

      {report && (
        <div className="report-card">
          <div className="report-header">
            <div>
              <h2 style={{ fontSize: '1.1rem', marginBottom: 2 }}>Customer Feedback Report</h2>
              <p style={{ color: 'var(--ink-60)', fontSize: '0.82rem' }}>Analysis period: last {report.stats.period}</p>
            </div>
            <span className="report-badge">VoC Report</span>
          </div>

          {/* Executive narrative */}
          <div className="report-section">
            <h3>Executive summary</h3>
            <div className="report-narrative">{report.narrative}</div>
          </div>

          {/* Key stats */}
          <div className="report-section">
            <h3>Key metrics</h3>
            <div className="report-stats-grid">
              <div className="report-stat">
                <div className="report-stat-num">{report.stats.total}</div>
                <div className="report-stat-label">Total feedback entries</div>
              </div>
              <div className="report-stat">
                <div className="report-stat-num" style={{ color: 'var(--pos)' }}>
                  {report.stats.sentimentBreakdown.positive}
                  <span style={{ fontSize: '0.9rem', marginLeft: 4, color: 'var(--ink-60)' }}>
                    ({report.stats.positiveRate}%)
                  </span>
                </div>
                <div className="report-stat-label">Positive responses</div>
              </div>
              <div className="report-stat">
                <div className="report-stat-num" style={{ color: 'var(--neg)' }}>
                  {report.stats.sentimentBreakdown.negative}
                  <span style={{ fontSize: '0.9rem', marginLeft: 4, color: 'var(--ink-60)' }}>
                    ({report.stats.negativeRate}%)
                  </span>
                </div>
                <div className="report-stat-label">Negative responses</div>
              </div>
            </div>
          </div>

          {/* Top themes */}
          {report.stats.topThemes.length > 0 && (
            <div className="report-section">
              <h3>Top themes</h3>
              <div className="theme-pills">
                {report.stats.topThemes.map((t) => (
                  <div key={t.theme} className="theme-pill">
                    {t.theme} <strong>·{t.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Channel breakdown */}
          {Object.keys(report.stats.channelCounts).length > 0 && (
            <div className="report-section">
              <h3>Channel breakdown</h3>
              <div className="theme-pills">
                {Object.entries(report.stats.channelCounts).map(([ch, count]) => (
                  <div key={ch} className="theme-pill" style={{ textTransform: 'capitalize' }}>
                    {ch.replace('_', ' ')} <strong>·{count}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
