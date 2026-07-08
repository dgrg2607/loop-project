import { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useDebounce from '../hooks/useDebounce';
import Pagination from '../components/Pagination';
import FeedbackFormModal from '../components/FeedbackFormModal';

const SENTIMENT_COLORS = { positive: '#1e6641', neutral: '#b86b00', negative: '#c0392b' };

export default function Feedback() {
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [filters, setFilters] = useState({ channel: '', sentiment: '', search: '' });
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const debouncedSearch = useDebounce(filters.search, 350);
  const canDelete = user?.role === 'admin' || user?.role === 'manager';

  const load = (pg = page) => {
    setLoading(true);
    const params = { page: pg, limit: 15 };
    if (filters.channel) params.channel = filters.channel;
    if (filters.sentiment) params.sentiment = filters.sentiment;
    if (debouncedSearch) params.search = debouncedSearch;
    api.get('/feedback', { params })
      .then((res) => { setItems(res.data.items); setMeta(res.data); setSelected(new Set()); })
      .catch(() => toast.error('Failed to load feedback'))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useState(() => { load(1); }, [filters.channel, filters.sentiment, debouncedSearch]);

  const setFilter = (k) => (e) => { setFilters((f) => ({ ...f, [k]: e.target.value })); setPage(1); };

  const handleCreate = async (form) => {
    try {
      await api.post('/feedback', { ...form, rating: Number(form.rating) || undefined });
      setShowModal(false);
      toast.success('Feedback added');
      load(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await api.delete(`/feedback/${id}`);
      toast.success('Deleted');
      load(page);
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.size} entries?`)) return;
    try {
      await api.post('/feedback/bulk-delete', { ids: [...selected] });
      toast.success(`Deleted ${selected.size} entries`);
      load(1);
    } catch {
      toast.error('Bulk delete failed');
    }
  };

  const exportCsv = () => {
    const params = new URLSearchParams();
    if (filters.channel) params.set('channel', filters.channel);
    if (filters.sentiment) params.set('sentiment', filters.sentiment);
    if (debouncedSearch) params.set('search', debouncedSearch);
    const token = localStorage.getItem('loop_token');
    window.open(
      `${import.meta.env.VITE_API_URL}/feedback/export.csv?${params}`,
      '_blank'
    );
  };

  const toggleSelect = (id) => setSelected((s) => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const toggleAll = () => setSelected(selected.size === items.length ? new Set() : new Set(items.map((i) => i._id)));

  const goPage = (p) => { setPage(p); load(p); };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1 style={{ fontSize: '1.4rem', marginBottom: 4 }}>Feedback</h1>
          <p style={{ color: 'var(--ink-60)', fontSize: '0.88rem' }}>Browse, filter and manage all customer feedback.</p>
        </div>
        <div className="page-header-actions">
          {canDelete && (
            <button className="btn-ghost" onClick={exportCsv} title="Export to CSV">
              ↓ Export CSV
            </button>
          )}
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add feedback</button>
        </div>
      </div>

      <div className="filter-bar">
        <input
          placeholder="Search feedback…"
          value={filters.search}
          onChange={setFilter('search')}
        />
        <select value={filters.channel} onChange={setFilter('channel')} style={{ width: 160 }}>
          <option value="">All channels</option>
          <option value="email">Email</option>
          <option value="chat">Chat</option>
          <option value="survey">Survey</option>
          <option value="social">Social</option>
          <option value="review">Review</option>
          <option value="support_ticket">Support ticket</option>
        </select>
        <select value={filters.sentiment} onChange={setFilter('sentiment')} style={{ width: 150 }}>
          <option value="">All sentiment</option>
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negative</option>
        </select>
      </div>

      {canDelete && selected.size > 0 && (
        <div className="bulk-bar">
          <span className="bulk-bar-count">{selected.size} selected</span>
          <button className="btn-ghost" style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '4px 10px', borderRadius: 6 }} onClick={() => setSelected(new Set())}>
            Clear
          </button>
          <button
            style={{ background: 'var(--neg)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            onClick={handleBulkDelete}
          >
            Delete {selected.size}
          </button>
        </div>
      )}

      <div className="table-wrap">
        {loading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--ink-60)' }}>Loading…</div>
        ) : items.length === 0 ? (
          <div className="empty-state">No feedback matches these filters.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {canDelete && (
                  <th style={{ width: 40 }}>
                    <input type="checkbox" checked={selected.size === items.length} onChange={toggleAll} />
                  </th>
                )}
                <th>Customer</th>
                <th>Channel</th>
                <th>Feedback</th>
                <th>Sentiment</th>
                <th>Themes</th>
                <th>Date</th>
                {canDelete && <th />}
              </tr>
            </thead>
            <tbody>
              {items.map((fb) => (
                <tr key={fb._id} style={selected.has(fb._id) ? { background: 'var(--green-soft)' } : {}}>
                  {canDelete && (
                    <td>
                      <input type="checkbox" checked={selected.has(fb._id)} onChange={() => toggleSelect(fb._id)} />
                    </td>
                  )}
                  <td style={{ fontWeight: 500, fontSize: '0.83rem' }}>{fb.customerName}</td>
                  <td><span className="badge">{fb.channel.replace('_', ' ')}</span></td>
                  <td className="feedback-text" style={{ fontSize: '0.83rem' }}>{fb.text}</td>
                  <td>
                    <span className="sentiment-pill" style={{ background: SENTIMENT_COLORS[fb.sentiment.label] }}>
                      {fb.sentiment.label}
                    </span>
                  </td>
                  <td className="themes-cell">{fb.themes.join(', ')}</td>
                  <td style={{ color: 'var(--ink-60)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {new Date(fb.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  {canDelete && (
                    <td>
                      <button className="btn-link danger" onClick={() => handleDelete(fb._id)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={meta.page} pages={meta.pages} total={meta.total} onChange={goPage} />
      </div>

      {showModal && <FeedbackFormModal onClose={() => setShowModal(false)} onSubmit={handleCreate} />}
    </div>
  );
}
