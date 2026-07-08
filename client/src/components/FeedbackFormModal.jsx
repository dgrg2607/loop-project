import { useState } from 'react';

const CHANNELS = [
  { value: 'email', label: 'Email' },
  { value: 'chat', label: 'Chat' },
  { value: 'survey', label: 'Survey' },
  { value: 'social', label: 'Social' },
  { value: 'review', label: 'Review' },
  { value: 'support_ticket', label: 'Support ticket' },
];

const STARS = [1, 2, 3, 4, 5];

export default function FeedbackFormModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    customerName: '', customerEmail: '', channel: 'survey', text: '', rating: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [hover, setHover] = useState(0);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.text.trim()) return;
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add customer feedback</h3>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="m-name">Customer name</label>
              <input id="m-name" placeholder="Jane Doe" value={form.customerName} onChange={set('customerName')} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="m-email">Customer email</label>
              <input id="m-email" type="email" placeholder="jane@example.com" value={form.customerEmail} onChange={set('customerEmail')} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="m-channel">Channel</label>
              <select id="m-channel" value={form.channel} onChange={set('channel')}>
                {CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Rating</label>
              <div style={{ display: 'flex', gap: 4, paddingTop: 4 }}>
                {STARS.map((s) => (
                  <button
                    type="button" key={s}
                    style={{
                      fontSize: '1.3rem', background: 'none', border: 'none', padding: '2px',
                      color: s <= (hover || form.rating) ? '#c98a2c' : '#e4e1d8',
                      cursor: 'pointer', transition: 'color 0.1s',
                    }}
                    onClick={() => setForm((f) => ({ ...f, rating: s }))}
                    onMouseEnter={() => setHover(s)}
                    onMouseLeave={() => setHover(0)}
                  >★</button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" htmlFor="m-text">Feedback text <span style={{ color: 'var(--neg)' }}>*</span></label>
            <textarea
              id="m-text" rows="4" required
              value={form.text} onChange={set('text')}
              placeholder="What did the customer say?"
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting || !form.text.trim()}>
              {submitting ? <><span className="btn-spinner" /> Saving…</> : 'Save feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
